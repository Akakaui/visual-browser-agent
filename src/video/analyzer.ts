import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import type { VideoMetadata, FrameData, SceneChange } from './types.js';

const exec = promisify(execCb);

export class VideoAnalyzer {
  async getMetadata(videoPath: string): Promise<VideoMetadata> {
    const { stdout } = await exec(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`,
    );
    const probe = JSON.parse(stdout) as {
      format: { duration: string };
      streams: Array<{
        codec_type: string;
        codec_name: string;
        width?: number;
        height?: number;
        r_frame_rate?: string;
        avg_frame_rate?: string;
      }>;
    };

    const videoStream = probe.streams.find(
      (s) => s.codec_type === 'video',
    );
    if (!videoStream) {
      throw new Error(`No video stream found in ${videoPath}`);
    }

    const fpsStr = videoStream.avg_frame_rate ?? videoStream.r_frame_rate ?? '0/1';
    const fpsParts = fpsStr.split('/').map(Number);
    const num = fpsParts[0] ?? 0;
    const den = fpsParts[1] ?? 1;
    const averageFps = den > 0 ? num / den : 0;

    const width = videoStream.width ?? 0;
    const height = videoStream.height ?? 0;
    const codec = videoStream.codec_name;
    const durationSeconds = Number.parseFloat(probe.format.duration);

    return {
      path: videoPath,
      durationSeconds,
      width,
      height,
      averageFps,
      variableFrameRate: false,
      codec,
    };
  }

  async extractFrames(
    videoPath: string,
    outputDir: string,
    options?: { fps?: number; startTime?: number; duration?: number },
  ): Promise<FrameData[]> {
    const fps = options?.fps ?? 1;
    const startTime = options?.startTime ?? 0;
    const duration = options?.duration ?? 0;

    const fpsFilter = `fps=${fps}`;
    const timeFlags = startTime > 0 ? `-ss ${startTime}` : '';
    const durationFlag = duration > 0 ? `-t ${duration}` : '';

    await exec(
      `ffmpeg -i "${videoPath}" ${timeFlags} ${durationFlag} -vf "${fpsFilter}" -q:v 2 "${outputDir}/frame_%04d.jpg"`,
    );

    const metadata = await this.getMetadata(videoPath);
    const frames: FrameData[] = [];

    const totalFrames = Math.ceil(metadata.durationSeconds * fps);
    for (let i = 1; i <= totalFrames; i++) {
      frames.push({
        index: i - 1,
        timestamp: (i - 1) / fps,
        path: `${outputDir}/frame_${String(i).padStart(4, '0')}.jpg`,
        score: 0,
      });
    }

    return frames;
  }

  async detectSceneChanges(videoPath: string): Promise<SceneChange[]> {
    const { stdout } = await exec(
      `ffmpeg -i "${videoPath}" -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1`,
    );

    const sceneChanges: SceneChange[] = [];
    const regex = /pts_time:(\d+\.?\d*)/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(stdout)) !== null) {
      const ptsTime = match[1];
      if (ptsTime !== undefined) {
        const timestamp = Number.parseFloat(ptsTime);
        sceneChanges.push({ timestamp, score: 1 });
      }
    }

    return sceneChanges;
  }
}

export const videoAnalyzer = new VideoAnalyzer();
