export interface VideoMetadata {
  path: string;
  durationSeconds: number;
  width: number;
  height: number;
  averageFps: number;
  variableFrameRate: boolean;
  codec: string;
}

export interface FrameData {
  index: number;
  timestamp: number;
  path: string;
  score: number;
}

export interface VideoManifest {
  runId: string;
  video: VideoMetadata;
  frames: FrameData[];
  events: Array<{ timestamp: number; type: string; frame?: string }>;
}

export interface SceneChange {
  timestamp: number;
  score: number;
}
