import { readFile, writeFile, readdir, stat, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { configManager } from '../config/index.js';

interface RetentionPolicy {
  rawVideoDays: number;
  screenshotsDays: number;
  reportsDays: number;
  maxRunSizeMb: number;
  deleteExpiredAutomatically: boolean;
}

interface ArtifactRecord {
  path: string;
  type: 'screenshot' | 'recording' | 'report';
  createdAt: number;
  size: number;
  runId?: string;
  tags?: string[];
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

  async initialize(): Promise<void> {
    await this.loadManifest();
    if (this.policy.deleteExpiredAutomatically) {
      await this.cleanup();
    }
  }

  async registerArtifact(path: string, type: 'screenshot' | 'recording' | 'report', runId?: string, tags?: string[]): Promise<void> {
    const stats = await stat(path);
    const record: ArtifactRecord = {
      path,
      type,
      createdAt: Date.now(),
      size: stats.size,
      runId,
      tags
    };
    this.artifacts.push(record);
    await this.saveManifest();
  }

  async cleanup(): Promise<number> {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    let deleted = 0;

    const toKeep: ArtifactRecord[] = [];

    for (const artifact of this.artifacts) {
      const ageDays = (now - artifact.createdAt) / dayMs;
      let maxAge = this.policy.reportsDays;

      if (artifact.type === 'recording') maxAge = this.policy.rawVideoDays;
      else if (artifact.type === 'screenshot') maxAge = this.policy.screenshotsDays;

      if (ageDays > maxAge) {
        try {
          await unlink(artifact.path);
          deleted++;
        } catch {}
      } else {
        toKeep.push(artifact);
      }
    }

    this.artifacts = toKeep;
    await this.saveManifest();
    return deleted;
  }

  async deleteArtifacts(paths: string[]): Promise<void> {
    for (const path of paths) {
      try {
        await unlink(path);
        this.artifacts = this.artifacts.filter(a => a.path !== path);
      } catch {}
    }
    await this.saveManifest();
  }

  async getRunSize(runId: string): Promise<number> {
    const runArtifacts = this.artifacts.filter(a => a.runId === runId);
    return runArtifacts.reduce((sum, a) => sum + a.size, 0);
  }

  async enforceRunSizeLimit(runId: string): Promise<void> {
    const size = await this.getRunSize(runId);
    const limit = this.policy.maxRunSizeMb * 1024 * 1024;
    if (size > limit) {
      const runArtifacts = this.artifacts
        .filter(a => a.runId === runId)
        .sort((a, b) => a.createdAt - b.createdAt);

      for (const artifact of runArtifacts) {
        await this.deleteArtifacts([artifact.path]);
        const newSize = await this.getRunSize(runId);
        if (newSize <= limit) break;
      }
    }
  }

  private async loadManifest(): Promise<void> {
    try {
      const content = await readFile(MANIFEST_FILE, 'utf-8');
      this.artifacts = JSON.parse(content);
    } catch {
      this.artifacts = [];
    }
  }

  private async saveManifest(): Promise<void> {
    await writeFile(MANIFEST_FILE, JSON.stringify(this.artifacts, null, 2), 'utf-8');
  }

  getArtifacts(): ArtifactRecord[] {
    return this.artifacts;
  }
}

export const retentionManager = new RetentionManager();

export async function deleteArtifacts(paths: string[]): Promise<void> {
  await retentionManager.deleteArtifacts(paths);
}