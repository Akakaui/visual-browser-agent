import { readFile, writeFile, stat, unlink, readdir } from 'fs/promises';
import { join, relative, resolve } from 'path';
import { configManager } from '../config/index.js';

export type RetainedArtifactType =
  | 'screenshot'
  | 'recording'
  | 'pdf'
  | 'trace'
  | 'download'
  | 'storage-state'
  | 'report'
  | 'log'
  | 'thumbnail';

interface RetentionPolicy {
  rawVideoDays: number;
  screenshotsDays: number;
  reportsDays: number;
  maxRunSizeMb: number;
  deleteExpiredAutomatically: boolean;
}

interface ArtifactRecord {
  path: string;
  type: RetainedArtifactType;
  createdAt: number;
  size: number;
  runId?: string;
  tags?: string[];
  sensitive?: boolean;
}

const MANIFEST_FILE = join(process.cwd(), '.vba-artifacts.json');

export class RetentionManager {
  private policy: RetentionPolicy;
  private artifacts: ArtifactRecord[] = [];

  constructor() {
    const config = configManager.getConfig();
    this.policy = {
      rawVideoDays: config.retention.rawVideoDays,
      screenshotsDays: config.retention.screenshotsDays,
      reportsDays: config.retention.reportsDays,
      maxRunSizeMb: config.retention.maxRunSizeMb,
      deleteExpiredAutomatically: config.retention.deleteExpiredAutomatically
    };
  }

  private approvedRoots(): string[] {
    const directories = configManager.getConfig().browser.approvedDirectories;
    return Object.values(directories).map(directory => resolve(directory));
  }

  private assertApprovedPath(path: string): string {
    const filepath = resolve(path);
    const approved = this.approvedRoots().some(root => {
      const child = relative(root, filepath);
      return child === '' || (child !== '..' && !child.startsWith(`..${requirePathSeparator()}`));
    });
    if (!approved) throw new Error(`Artifact path is outside approved directories: ${path}`);
    return filepath;
  }

  async initialize(): Promise<void> {
    await this.loadManifest();
    if (this.policy.deleteExpiredAutomatically) await this.cleanup();
  }

  async registerArtifact(path: string, type: RetainedArtifactType, runId?: string, tags?: string[], sensitive = false): Promise<void> {
    const filepath = this.assertApprovedPath(path);
    const stats = await stat(filepath);
    const existing = this.artifacts.find(artifact => artifact.path === filepath);
    const record: ArtifactRecord = { path: filepath, type, createdAt: Date.now(), size: stats.size, runId, tags, sensitive };
    if (existing) Object.assign(existing, record);
    else this.artifacts.push(record);
    await this.saveManifest();
  }

  async cleanup(): Promise<number> {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    let deleted = 0;
    const toKeep: ArtifactRecord[] = [];

    for (const artifact of this.artifacts) {
      const ageDays = (now - artifact.createdAt) / dayMs;
      const maxAge = artifact.sensitive ? 1 : artifact.type === 'recording' ? this.policy.rawVideoDays : artifact.type === 'screenshot' ? this.policy.screenshotsDays : artifact.type === 'report' ? this.policy.reportsDays : this.policy.reportsDays;
      if (ageDays > maxAge) {
        try {
          await this.deleteFileSafely(artifact.path);
          deleted++;
        } catch {
          toKeep.push(artifact);
        }
      } else {
        toKeep.push(artifact);
      }
    }

    this.artifacts = toKeep;
    await this.saveManifest();
    return deleted;
  }

  async deleteArtifacts(paths: string[], confirm = false): Promise<void> {
    if (!confirm) throw new Error('Artifact deletion requires confirm=true.');
    for (const path of paths) {
      try {
        await this.deleteFileSafely(path);
        this.artifacts = this.artifacts.filter(a => resolve(a.path) !== resolve(path));
      } catch {
        // Deletion is idempotent for already-missing files.
      }
    }
    await this.saveManifest();
  }

  async getRunSize(runId: string): Promise<number> {
    const runArtifacts = this.artifacts.filter(a => a.runId === runId);
    return runArtifacts.reduce((sum, a) => sum + a.size, 0);
  }

  async enforceRunSizeLimit(runId: string): Promise<void> {
    const limit = this.policy.maxRunSizeMb * 1024 * 1024;
    const runArtifacts = this.artifacts.filter(a => a.runId === runId).sort((a, b) => a.createdAt - b.createdAt);
    while (await this.getRunSize(runId) > limit && runArtifacts.length > 0) {
      const oldest = runArtifacts.shift();
      if (!oldest) break;
      await this.deleteArtifacts([oldest.path], true);
    }
  }

  private async deleteFileSafely(path: string): Promise<void> {
    const filepath = this.assertApprovedPath(path);
    await unlink(filepath);
  }

  private async loadManifest(): Promise<void> {
    try {
      this.artifacts = JSON.parse(await readFile(MANIFEST_FILE, 'utf-8')) as ArtifactRecord[];
    } catch {
      this.artifacts = [];
    }
  }

  private async saveManifest(): Promise<void> {
    await writeFile(MANIFEST_FILE, JSON.stringify(this.artifacts, null, 2), 'utf-8');
  }

  getArtifacts(): ArtifactRecord[] {
    return [...this.artifacts];
  }
}

function requirePathSeparator(): string {
  return process.platform === 'win32' ? '\\' : '/';
}

export const retentionManager = new RetentionManager();

export async function deleteArtifacts(paths: string[], confirm = false): Promise<void> {
  await retentionManager.deleteArtifacts(paths, confirm);
}
