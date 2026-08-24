import { randomUUID } from 'node:crypto';
import type { Artifact, ArtifactVersion, ArtifactStatus } from './types.js';

type ArtifactInput = Omit<
  Artifact,
  'id' | 'version' | 'createdAt' | 'updatedAt' | 'status'
>;

export class ArtifactRegistry {
  private artifacts = new Map<string, Artifact>();
  private versionHistory = new Map<string, ArtifactVersion[]>();

  create(input: ArtifactInput): Artifact {
    const now = Date.now();
    const id = randomUUID();

    const artifact: Artifact = {
      ...input,
      id,
      version: 1,
      createdAt: now,
      updatedAt: now,
      status: 'current',
    };

    this.artifacts.set(id, artifact);
    this.versionHistory.set(id, [
      {
        artifactId: id,
        version: 1,
        path: artifact.path,
        createdAt: now,
      },
    ]);

    return artifact;
  }

  update(
    id: string,
    patch: Partial<Artifact>,
    changeNote?: string,
  ): Artifact {
    const existing = this.artifacts.get(id);
    if (!existing) {
      throw new Error(`Artifact not found: ${id}`);
    }

    const now = Date.now();
    const nextVersion = existing.version + 1;
    const newPath =
      patch.path !== undefined ? patch.path : existing.path;

    const updated: Artifact = {
      ...existing,
      ...patch,
      id,
      version: nextVersion,
      updatedAt: now,
    };

    this.artifacts.set(id, updated);

    const history = this.versionHistory.get(id) ?? [];
    history.push({
      artifactId: id,
      version: nextVersion,
      path: newPath,
      createdAt: now,
      changeNote,
    });
    this.versionHistory.set(id, history);

    return updated;
  }

  list(): Artifact[] {
    return Array.from(this.artifacts.values());
  }

  get(id: string): Artifact | undefined {
    return this.artifacts.get(id);
  }

  versions(id: string): ArtifactVersion[] {
    return this.versionHistory.get(id) ?? [];
  }

  archive(id: string): void {
    this.setStatus(id, 'archived');
  }

  delete(id: string): void {
    this.setStatus(id, 'deleted');
  }

  private setStatus(id: string, status: ArtifactStatus): void {
    const artifact = this.artifacts.get(id);
    if (!artifact) {
      throw new Error(`Artifact not found: ${id}`);
    }

    this.artifacts.set(id, {
      ...artifact,
      status,
      updatedAt: Date.now(),
    });
  }
}

export const artifactRegistry = new ArtifactRegistry();
