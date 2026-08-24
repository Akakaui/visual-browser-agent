import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import * as yaml from 'yaml';
import { VisualBrowserConfig, DEFAULT_CONFIG, ConfigPath } from './schema.js';

const CONFIG_PATHS = [
  './visual-browser-agent.yaml',
  './visual-browser-agent.yml',
  './config/visual-browser-agent.yaml',
  './config/visual-browser-agent.yml',
  join(process.cwd(), 'visual-browser-agent.yaml'),
  join(process.cwd(), 'visual-browser-agent.yml'),
  join(process.env['HOME'] || process.env['USERPROFILE'] || '', '.config', 'visual-browser-agent', 'config.yaml'),
  join(process.env['HOME'] || process.env['USERPROFILE'] || '', '.config', 'visual-browser-agent', 'config.yml')
];

export class ConfigManager {
  private config: VisualBrowserConfig;
  private loadedPath: string | null = null;

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  async load(customPath?: string): Promise<VisualBrowserConfig> {
    const paths = customPath ? [customPath, ...CONFIG_PATHS] : CONFIG_PATHS;

    for (const path of paths) {
      try {
        const content = await readFile(path, 'utf-8');
        const parsed = yaml.parse(content) as Partial<VisualBrowserConfig>;
        this.config = this.mergeDeep(this.config, parsed);
        this.loadedPath = path;
        break;
      } catch {
        continue;
      }
    }

    await this.ensureDirectories();
    return this.config;
  }

  getConfig(): VisualBrowserConfig {
    return this.config;
  }

  get(path: ConfigPath): unknown {
    const keys = path.split('.');
    let current: unknown = this.config;
    for (const key of keys) {
      if (!key || current === undefined || current === null) return undefined;
      current = (current as Record<string, unknown>)[key];
    }
    return current;
  }

  set(path: ConfigPath, value: unknown): void {
    const keys = path.split('.');
    let current = this.config as unknown as Record<string, unknown>;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!key) continue;
      if (typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }
    const lastKey = keys[keys.length - 1];
    if (lastKey) current[lastKey] = value;
  }

  async save(path?: string): Promise<string> {
    const savePath = path || this.loadedPath || CONFIG_PATHS[0];
    if (!savePath) throw new Error('No config path available');
    await mkdir(dirname(savePath), { recursive: true });
    await writeFile(savePath, yaml.stringify(this.config), 'utf-8');
    this.loadedPath = savePath;
    return savePath;
  }

  async ensureDirectories(): Promise<void> {
    const dirs = Object.values(this.config.browser.approvedDirectories);
    for (const dir of dirs) {
      await mkdir(dir, { recursive: true });
    }
  }

  private mergeDeep(target: any, source: any): any {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeDeep(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  getLoadedPath(): string | null {
    return this.loadedPath;
  }
}

export const configManager = new ConfigManager();