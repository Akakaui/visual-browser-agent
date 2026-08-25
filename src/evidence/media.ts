import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, stat } from 'fs/promises';
import { dirname, extname, resolve, relative } from 'path';
import { configManager } from '../config/index.js';

const execFileAsync = promisify(execFile);

export type MediaOperation = 'clip' | 'frames' | 'thumbnail' | 'contact-sheet' | 'probe';

function approved(path: string): string {
  const filepath = resolve(path);
  const roots = Object.values(configManager.getConfig().browser.approvedDirectories).map(value => resolve(value));
  const allowed = roots.some(root => {
    const child = relative(root, filepath);
    return child === '' || (child !== '..' && !child.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`));
  });
  if (!allowed) throw new Error(`Media path is outside approved directories: ${path}`);
  return filepath;
}

function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function processVideo(input: {
  sourcePath: string;
  operation: Exclude<MediaOperation, 'probe'>;
  outputPath?: string;
  startSeconds?: number;
  durationSeconds?: number;
  fps?: number;
  tile?: string;
}): Promise<{ operation: string; sourcePath: string; outputPath: string; metadata?: Record<string, unknown> }> {
  const source = approved(input.sourcePath);
  await stat(source);
  const sourceMetadata = await probeMedia(source).catch(() => ({}));
  const sourceStream = Array.isArray((sourceMetadata as any).streams) ? (sourceMetadata as any).streams.find((stream: any) => stream.codec_type === 'video' || stream.width) : undefined;
  const sourceFps = sourceStream?.r_frame_rate ? parseRate(sourceStream.r_frame_rate) : undefined;
  const baseDir = resolve(configManager.get('browser.approvedDirectories.evidence') as string);
  const output = approved(input.outputPath || resolve(baseDir, 'processed', `${Date.now()}-${safeName(input.operation)}${input.operation === 'frames' ? '-%04d.jpg' : input.operation === 'thumbnail' || input.operation === 'contact-sheet' ? '.jpg' : '.mp4'}`));
  await mkdir(dirname(output), { recursive: true });
  const start = Math.max(0, Number(input.startSeconds || 0));
  const duration = input.durationSeconds === undefined ? undefined : Math.max(0.1, Number(input.durationSeconds));
  const args: string[] = ['-y'];
  if (start > 0) args.push('-ss', String(start));
  args.push('-i', source);
  if (duration !== undefined) args.push('-t', String(duration));
  if (input.operation === 'clip') args.push('-c:v', 'libx264', '-c:a', 'aac', output);
  else if (input.operation === 'frames') args.push('-vf', `fps=${Math.max(0.1, Number(input.fps || 30))}`, output);
  else if (input.operation === 'thumbnail') args.push('-frames:v', '1', '-vf', 'scale=1280:-1', output);
  else args.push('-vf', `fps=${Math.max(0.1, Number(input.fps || 4))},scale=640:-1,tile=${input.tile || '4x4'}`, '-frames:v', '1', output);
  await execFileAsync('ffmpeg', args, { maxBuffer: 4 * 1024 * 1024 });
  const outputStats = await stat(output.replace('%04d', '0001')).catch(() => stat(output));
  const outputPath = output.replace('%04d', '0001');
  const requestedFps = input.fps;
  return { operation: input.operation, sourcePath: source, outputPath, metadata: { sizeBytes: outputStats.size, startSeconds: start, durationSeconds: duration, requestedFps, sourceFps, warning: requestedFps && sourceFps && requestedFps > sourceFps ? `Source is approximately ${sourceFps} FPS; extraction above that rate cannot add new motion information.` : undefined } };
}

function parseRate(rate: string): number | undefined {
  const parts = rate.split('/').map(Number);
  if (parts.length !== 2) return undefined;
  const numerator = parts[0];
  const denominator = parts[1];
  if (numerator === undefined || denominator === undefined || !Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return undefined;
  return Math.round((numerator / denominator) * 100) / 100;
}

export async function probeMedia(sourcePath: string): Promise<Record<string, unknown>> {
  const source = approved(sourcePath);
  await stat(source);
  const { stdout } = await execFileAsync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size,format_name:stream=index,codec_name,width,height,r_frame_rate', '-of', 'json', source], { maxBuffer: 2 * 1024 * 1024 });
  return JSON.parse(stdout) as Record<string, unknown>;
}
