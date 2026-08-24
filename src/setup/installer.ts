import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { configManager } from '../config/index.js';

export interface SetupStatus {
  package: { installed: boolean; version: string };
  chromium: { installed: boolean };
  config: { path: string | null; loaded: boolean };
  dashboard: { url: string };
}

export async function getSetupStatus(): Promise<SetupStatus> {
  await configManager.load();
  let chromiumInstalled = false;
  try {
    const { chromium } = await import('playwright');
    chromiumInstalled = existsSync(chromium.executablePath());
  } catch {}
  return {
    package: { installed: true, version: '0.1.0' },
    chromium: { installed: chromiumInstalled },
    config: { path: configManager.getLoadedPath(), loaded: true },
    dashboard: { url: 'http://127.0.0.1:8787/' }
  };
}

export async function installRuntime(component: 'chromium' | 'config', confirm: boolean): Promise<string> {
  if (!confirm) throw new Error('Installation changes the local environment. Ask the user for confirmation before continuing.');
  if (component === 'config') {
    await configManager.load();
    const path = await configManager.save();
    return `Configuration initialized at ${path}`;
  }
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['playwright', 'install', 'chromium'], { stdio: 'inherit', cwd: process.cwd() });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Playwright Chromium installation exited with code ${code}`)));
  });
  return 'Playwright Chromium installed successfully';
}
