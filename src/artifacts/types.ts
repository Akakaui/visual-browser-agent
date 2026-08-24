export type ArtifactType =
  | 'document'
  | 'diagram'
  | 'chart'
  | 'screenshot'
  | 'clip'
  | 'report'
  | 'html'
  | 'svg';

export type ArtifactStatus = 'current' | 'archived' | 'deleted';

export interface Artifact {
  id: string;
  name: string;
  type: ArtifactType;
  version: number;
  path: string;
  createdAt: number;
  updatedAt: number;
  sourceUrls: string[];
  tags: string[];
  status: ArtifactStatus;
  parentId?: string;
}

export interface ArtifactVersion {
  artifactId: string;
  version: number;
  path: string;
  createdAt: number;
  changeNote?: string;
}
