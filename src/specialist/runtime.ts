import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { browserAdapter } from '../adapter/browser-adapter.js';
import { PageSnapshot } from '../adapter/types.js';
import { SpecialistPlanner } from './planner.js';
import {
  SpecialistTaskRequest,
  SpecialistTaskResponse,
  Finding,
  EvidenceRef
} from './types.js';

export class SpecialistRuntime {
  async execute(request: SpecialistTaskRequest): Promise<SpecialistTaskResponse> {
    const keptEvidence: EvidenceRef[] = [];
    let snapshot: PageSnapshot | undefined;

    try {
      await browserAdapter.createRunContext(request.objective, request.requirements);
      const plan = new SpecialistPlanner(request.mode);

      for (const step of plan.plan()) {
        if (step.optional) continue;

        const result = await this.runStep(step.name, request, p => { snapshot = p; });
        if (result.evidence) keptEvidence.push(result.evidence);
      }

      return this.buildResponse(request, snapshot, keptEvidence, []);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        taskId: request.taskId,
        status: 'blocked',
        summary: `Task blocked: ${message}`,
        findings: [],
        artifacts: { keptEvidence: keptEvidence.map(e => e.path) },
        humanEvents: [],
        limitations: [message]
      };
    }
  }

  private async runStep(
    name: string,
    request: SpecialistTaskRequest,
    onSnapshot: (s: PageSnapshot) => void
  ): Promise<{ evidence?: EvidenceRef }> {
    switch (name) {
      case 'connect-browser':
        await browserAdapter.connect({ mode: 'managed', headless: false });
        return {};
      case 'navigate': {
        if (!request.startUrl) return {};
        const snap = await browserAdapter.navigate({ url: request.startUrl });
        onSnapshot(snap);
        return {};
      }
      case 'inspect-structured': {
        const snap = await browserAdapter.inspectPage({ includeA11y: true, includeDOM: false });
        onSnapshot(snap);
        return {};
      }
      case 'capture-screenshot': {
        const shot = await browserAdapter.captureScreenshot({
          action: request.mode,
          requirement: request.requirements.join('; ')
        });
        return { evidence: { type: 'screenshot', path: shot.path, timestamp: shot.timestamp } };
      }
      case 'synthesize-report':
        return await this.writeReport(request);
      default:
        return {};
    }
  }

  private async writeReport(request: SpecialistTaskRequest): Promise<{ evidence: EvidenceRef }> {
    const runDir = join(process.cwd(), 'runs', request.taskId);
    await mkdir(runDir, { recursive: true });

    const lines = [
      `# Visual Browser Report`,
      ``,
      `- **Task:** ${request.taskId}`,
      `- **Mode:** ${request.mode}`,
      `- **Objective:** ${request.objective}`,
      `- **Requirements:** ${request.requirements.join('; ') || 'none'}`,
      ``,
      `## Findings`,
      `See manifest and captured evidence for details.`,
      ``
    ].join('\n');

    const reportPath = join(runDir, 'report.md');
    await writeFile(reportPath, lines, 'utf-8');
    return { evidence: { type: 'trace', path: reportPath } };
  }

  private buildResponse(
    request: SpecialistTaskRequest,
    snapshot: PageSnapshot | undefined,
    evidence: EvidenceRef[],
    humanEvents: SpecialistTaskResponse['humanEvents']
  ): SpecialistTaskResponse {
    const findings = this.buildFindings(snapshot, evidence);
    const status: SpecialistTaskResponse['status'] = findings.length > 0 ? 'completed' : 'partial';

    return {
      taskId: request.taskId,
      status,
      summary: snapshot
        ? `Inspected ${snapshot.url} (${snapshot.title}). ${findings.length} finding(s).`
        : `Executed ${request.mode} without page inspection.`,
      findings,
      artifacts: { keptEvidence: evidence.map(e => e.path) },
      humanEvents,
      limitations: ['Tested in Chromium only', 'Vision review not yet connected']
    };
  }

  private buildFindings(snapshot: PageSnapshot | undefined, evidence: EvidenceRef[]): Finding[] {
    const findings: Finding[] = [];

    if (snapshot && snapshot.metadata.consoleErrors.length > 0) {
      findings.push({
        severity: 'low',
        claim: `${snapshot.metadata.consoleErrors.length} console error(s) during load`,
        confidence: 0.95,
        evidence: evidence.filter(e => e.type === 'screenshot'),
        recommendedAction: 'Review console errors for broken resources'
      });
    }

    return findings;
  }
}

export * from './types.js';