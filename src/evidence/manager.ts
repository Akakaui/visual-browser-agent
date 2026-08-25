import { randomUUID } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'path';
import { configManager } from '../config/index.js';
import { retentionManager } from '../retention/manager.js';

export type EvidenceKind =
  | 'screenshot'
  | 'recording'
  | 'pdf'
  | 'trace'
  | 'download'
  | 'storage-state'
  | 'report'
  | 'log'
  | 'thumbnail';

export interface EvidenceArtifact {
  id: string;
  runId: string;
  kind: EvidenceKind;
  path: string;
  mimeType: string;
  createdAt: number;
  sizeBytes: number;
  sourceUrls: string[];
  action?: string;
  requirement?: string;
  sensitive: boolean;
  embedded: boolean;
  retentionClass: 'recording' | 'screenshot' | 'report' | 'persistent' | 'sensitive';
  metadata?: Record<string, unknown>;
}

export interface EvidenceEvent {
  eventId: string;
  timestamp: number;
  action: string;
  url?: string;
  artifacts: string[];
  consoleMessages: number;
  networkRequests: number;
  accessibilityCaptured: boolean;
  domCaptured: boolean;
  notes?: string[];
}

export interface EvidenceRunManifest {
  runId: string;
  goal: string;
  requirements: string[];
  startedAt: number;
  finishedAt?: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  root: string;
  artifacts: EvidenceArtifact[];
  events: EvidenceEvent[];
  summary?: string;
}

const MIME_BY_KIND: Record<EvidenceKind, string> = {
  screenshot: 'image/png',
  recording: 'video/webm',
  pdf: 'application/pdf',
  trace: 'application/zip',
  download: 'application/octet-stream',
  'storage-state': 'application/json',
  report: 'application/json',
  log: 'application/json',
  thumbnail: 'image/jpeg'
};

export class EvidenceWorkspace {
  private readonly manifests = new Map<string, EvidenceRunManifest>();

  private root(): string {
    return resolve(configManager.get('browser.approvedDirectories.evidence') as string);
  }

  private runRoot(runId: string): string {
    const root = this.root();
    const runRoot = resolve(root, runId);
    if (relative(root, runRoot).startsWith('..')) {
      throw new Error('Evidence run path escaped the approved evidence directory.');
    }
    return runRoot;
  }

  private manifestPath(runId: string): string {
    return join(this.runRoot(runId), 'manifest.json');
  }

  private async persist(manifest: EvidenceRunManifest): Promise<void> {
    await mkdir(manifest.root, { recursive: true });
    await writeFile(this.manifestPath(manifest.runId), JSON.stringify(manifest, null, 2), 'utf-8');
  }

  async startRun(goal: string, requirements: string[] = []): Promise<EvidenceRunManifest> {
    const runId = `run-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const root = this.runRoot(runId);
    const manifest: EvidenceRunManifest = {
      runId,
      goal,
      requirements,
      startedAt: Date.now(),
      status: 'running',
      root,
      artifacts: [],
      events: []
    };
    await Promise.all([
      mkdir(join(root, 'screenshots'), { recursive: true }),
      mkdir(join(root, 'videos'), { recursive: true }),
      mkdir(join(root, 'pdfs'), { recursive: true }),
      mkdir(join(root, 'traces'), { recursive: true }),
      mkdir(join(root, 'logs'), { recursive: true }),
      mkdir(join(root, 'reports'), { recursive: true })
    ]);
    this.manifests.set(runId, manifest);
    await this.persist(manifest);
    return manifest;
  }

  async loadRun(runId: string): Promise<EvidenceRunManifest | undefined> {
    const cached = this.manifests.get(runId);
    if (cached) return cached;
    try {
      const manifest = JSON.parse(await readFile(this.manifestPath(runId), 'utf-8')) as EvidenceRunManifest;
      this.manifests.set(runId, manifest);
      return manifest;
    } catch {
      return undefined;
    }
  }

  async registerArtifact(input: {
    runId: string;
    kind: EvidenceKind;
    path: string;
    sourceUrls?: string[];
    action?: string;
    requirement?: string;
    sensitive?: boolean;
    embedded?: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<EvidenceArtifact> {
    const manifest = await this.loadRun(input.runId);
    if (!manifest) throw new Error(`Evidence run not found: ${input.runId}`);
    const filepath = resolve(input.path);
    const approvedRoot = resolve(configManager.get('browser.approvedDirectories.evidence') as string);
    const approvedDirs = [
      approvedRoot,
      resolve(configManager.get('browser.approvedDirectories.screenshots') as string),
      resolve(configManager.get('browser.approvedDirectories.recordings') as string),
      resolve(configManager.get('browser.approvedDirectories.downloads') as string)
    ];
    if (!approvedDirs.some(dir => relative(dir, filepath) === '' || !relative(dir, filepath).startsWith('..'))) {
      throw new Error(`Artifact path is outside approved directories: ${input.path}`);
    }
    const fileStats = await stat(filepath);
    const sensitive = input.sensitive ?? input.kind === 'storage-state';
    const artifact: EvidenceArtifact = {
      id: `artifact-${randomUUID().slice(0, 12)}`,
      runId: input.runId,
      kind: input.kind,
      path: filepath,
      mimeType: MIME_BY_KIND[input.kind],
      createdAt: Date.now(),
      sizeBytes: fileStats.size,
      sourceUrls: input.sourceUrls ?? [],
      action: input.action,
      requirement: input.requirement,
      sensitive,
      embedded: input.embedded ?? input.kind === 'screenshot',
      retentionClass: sensitive ? 'sensitive' : input.kind === 'recording' ? 'recording' : input.kind === 'screenshot' ? 'screenshot' : input.kind === 'report' ? 'report' : 'persistent',
      metadata: input.metadata
    };
    manifest.artifacts.push(artifact);
    await this.persist(manifest);
    await retentionManager.registerArtifact(artifact.path, artifact.kind, artifact.runId, artifact.action ? [artifact.action] : [], artifact.sensitive);
    return artifact;
  }

  async appendEvent(runId: string, event: Omit<EvidenceEvent, 'eventId'>): Promise<EvidenceEvent> {
    const manifest = await this.loadRun(runId);
    if (!manifest) throw new Error(`Evidence run not found: ${runId}`);
    const next: EvidenceEvent = { ...event, eventId: `event-${randomUUID().slice(0, 8)}` };
    manifest.events.push(next);
    await this.persist(manifest);
    return next;
  }

  async finishRun(runId: string, status: EvidenceRunManifest['status'], summary?: string): Promise<EvidenceRunManifest> {
    const manifest = await this.loadRun(runId);
    if (!manifest) throw new Error(`Evidence run not found: ${runId}`);
    manifest.status = status;
    manifest.finishedAt = Date.now();
    manifest.summary = summary;
    await this.persist(manifest);
    return manifest;
  }

  async listRuns(): Promise<EvidenceRunManifest[]> {
    return [...this.manifests.values()];
  }
}

export const evidenceWorkspace = new EvidenceWorkspace();
