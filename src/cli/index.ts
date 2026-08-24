#!/usr/bin/env node
import { Command } from 'commander';
import { configManager } from '../config/index.js';
import { browserAdapter } from '../adapter/browser-adapter.js';
import { mkdir, writeFile, readFile, stat, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import which from 'which';
import semver from 'semver';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import type { SpecialistTaskRequest } from '../specialist/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name('visual-browser-agent')
  .description('Local-first, Playwright-enhanced visual browser for AI coding agents')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize visual-browser-agent: check deps, install browser, create config, install skills')
  .option('-f, --force', 'Overwrite existing config')
  .option('--mode <mode>', 'Browser mode: extension | managed | cdp', 'extension')
  .option('--skip-browser', 'Skip browser installation')
  .option('--skip-skills', 'Skip skills installation')
  .action(async (options) => {
    const spinner = ora('Initializing visual-browser-agent...').start();

    try {
      await checkNodeVersion(spinner);
      await checkPlaywright(spinner);
      await checkFFmpeg(spinner);
      await checkFilesystemPermissions(spinner);

      if (!options.skipBrowser) {
        await installBrowser(spinner, options.mode as 'extension' | 'managed' | 'cdp');
      }

      await createConfig(spinner, options.mode as 'extension' | 'managed' | 'cdp', options.force);
      await createApprovedDirectories(spinner);

      if (!options.skipSkills) {
        await installSkills(spinner);
      }

      await runTestPage(spinner);

      spinner.succeed('Initialization complete!');
      printSummary();
    } catch (error) {
      spinner.fail('Initialization failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program
  .command('doctor')
  .description('Check system dependencies and configuration')
  .action(async () => {
    console.log(chalk.bold('\n🔍 visual-browser-agent doctor\n'));

    await checkNodeVersion();
    await checkPlaywright();
    await checkFFmpeg();
    await checkFilesystemPermissions();
    await checkConfig();
    await checkBrowser();

    console.log(chalk.green('\n✅ All checks passed'));
  });

program
  .command('browser <action>')
  .description('Browser management')
  .argument('<action>', 'install | attach | status')
  .action(async (action) => {
    switch (action) {
      case 'install':
        await installBrowser(ora({ text: 'Installing browser...' }).start(), 'managed');
        break;
      case 'attach':
        console.log('Use "visual-browser-agent mcp" to connect via MCP');
        break;
      case 'status':
        const status = browserAdapter.getStatus();
        console.log(JSON.stringify(status, null, 2));
        break;
      default:
        console.error(`Unknown action: ${action}`);
    }
  });

program
  .command('profiles')
  .description('List available Chrome profiles')
  .action(async () => {
    const { printProfiles } = await import('../cli/profiles.js');
    await printProfiles();
  });

program
  .command('mcp')
  .description('Start MCP server (stdio)')
  .option('--port <port>', 'Port for Streamable HTTP (optional)')
  .option('--mode <mode>', 'Browser mode: managed | extension | cdp', 'managed')
  .option('--profile <profile>', 'Chrome profile name (for extension mode)')
  .option('--cdp-endpoint <url>', 'CDP endpoint URL (for cdp mode)')
  .action(async (options) => {
    const { startMCPServer } = await import('../mcp/server.js');
    const mcpOptions = {
      port: options.port ? parseInt(options.port) : undefined,
      browserMode: options.mode,
      profile: options.profile,
      cdpEndpoint: options.cdpEndpoint
    };
    await startMCPServer(mcpOptions.port, mcpOptions);
  });

program
  .command('skill')
  .description('Manage Agent Skills')
  .argument('<action>', 'install | list | uninstall')
  .argument('[skill]', 'Skill name (or "all")')
  .option('--host <host>', 'Target host for installation (claude-code, antigravity, cursor, etc.)')
  .action(async (action, skill, options) => {
    const { SkillManager } = await import('../skills/manager.js');
    const manager = new SkillManager();

    switch (action) {
      case 'install':
        await manager.install(skill || 'all', options.host);
        break;
      case 'list':
        await manager.list();
        break;
      case 'uninstall':
        await manager.uninstall(skill);
        break;
      default:
        console.error(`Unknown action: ${action}`);
    }
  });

program
  .command('host')
  .description('Host-specific installation helpers')
  .argument('<action>', 'install | config')
  .argument('<host>', 'Host name (claude-code, antigravity, cursor, windsurf, cline, roo, kiro, copilot, codex, gemini, opencode, goose)')
  .action(async (action, host) => {
    const { HostManager } = await import('../cli/host-manager.js');
    const manager = new HostManager();

    if (action === 'install') {
      await manager.install(host);
    } else if (action === 'config') {
      await manager.generateConfig(host);
    } else {
      console.error(`Unknown action: ${action}`);
    }
  });

program
  .command('agent <action>')
  .description('Specialist agent: run | review')
  .argument('[target]', 'URL for run, or run directory for review')
  .option('-m, --mode <mode>', 'Specialist mode', 'observe')
  .option('--task-id <id>', 'Task ID (defaults to task-<timestamp>)')
  .action(async (action, target, options) => {
    const { SpecialistRuntime } = await import('../specialist/runtime.js');
    if (action === 'run') {
      const request: SpecialistTaskRequest = {
        taskId: options.taskId || 'task-' + Date.now(),
        objective: 'CLI run: ' + (options.mode || 'observe'),
        startUrl: target,
        allowedDomains: [],
        mode: options.mode,
        requirements: [],
        humanPolicy: { allowTakeover: true, requireApprovalForPublicActions: true },
        retention: { rawVideo: 'temporary', report: 'keep' }
      };
      const runtime = new SpecialistRuntime();
      const response = await runtime.execute(request);
      console.log(JSON.stringify(response, null, 2));
    } else if (action === 'review') {
      const dir = target || join(process.cwd(), 'runs');
      console.log('Reviewing runs under: ' + dir);
    }
  });

program.parse();

async function checkNodeVersion(spinner?: Ora): Promise<void> {
  const version = process.version;
  const required = '>=20.0.0';
  if (!semver.satisfies(version, required)) {
    throw new Error(`Node.js ${required} required, found ${version}`);
  }
  spinner?.info(`Node.js ${version} ✓`);
}

async function checkPlaywright(spinner?: Ora): Promise<void> {
  try {
    const pkg = await import('playwright/package.json', { assert: { type: 'json' } });
    spinner?.info(`Playwright ${pkg.default.version} ✓`);
  } catch {
    throw new Error('Playwright not installed. Run: npm install playwright');
  }
}

async function checkFFmpeg(spinner?: Ora): Promise<void> {
  try {
    await which('ffmpeg');
    spinner?.info('FFmpeg ✓');
  } catch {
    console.warn(chalk.yellow('⚠ FFmpeg not found - video recording will be limited. Install: https://ffmpeg.org/download.html'));
  }
}

async function checkFilesystemPermissions(spinner?: Ora): Promise<void> {
  const testDir = join(process.cwd(), '.vba-test');
  try {
    await mkdir(testDir, { recursive: true });
    await writeFile(join(testDir, 'test.txt'), 'test');
    await rm(testDir, { recursive: true });
    spinner?.info('Filesystem permissions ✓');
  } catch {
    throw new Error('Cannot write to current directory. Check permissions.');
  }
}

async function installBrowser(spinner: Ora, mode: 'extension' | 'managed' | 'cdp'): Promise<void> {
  if (mode === 'extension') {
    spinner.info('Extension mode: Install Chrome extension from chrome://extensions (developer mode)');
    spinner.info('Extension source: ./browser-extension/');
    return;
  }

  spinner.text = 'Installing managed Chromium...';
  const { promisify } = await import('util');
  const { exec } = await import('child_process');
  await promisify(exec)('npx playwright install chromium');
  spinner.succeed('Managed Chromium installed');
}

async function createConfig(spinner: Ora, mode: 'extension' | 'managed' | 'cdp', force: boolean): Promise<void> {
  const configPath = join(process.cwd(), 'visual-browser-agent.yaml');

  try {
    await stat(configPath);
    if (!force) {
      spinner.info('Config already exists (use --force to overwrite)');
      return;
    }
  } catch {
    // File doesn't exist, create it
  }

  const config = configManager.getConfig();
  config.browser.mode = mode;

  const yaml = (await import('yaml')).default;
  await writeFile(configPath, yaml.stringify(config), 'utf-8');
  spinner.info(`Config created: ${configPath}`);
}

async function createApprovedDirectories(spinner: Ora): Promise<void> {
  const config = configManager.getConfig();
  for (const dir of Object.values(config.browser.approvedDirectories)) {
    await mkdir(dir, { recursive: true });
  }
  spinner.info('Approved directories created');
}

async function installSkills(spinner: Ora): Promise<void> {
  spinner.text = 'Installing Agent Skills...';
  const { SkillManager } = await import('../skills/manager.js');
  const manager = new SkillManager();
  await manager.install('all');
  spinner.succeed('Skills installed');
}

async function runTestPage(spinner: Ora): Promise<void> {
  spinner.text = 'Running test page...';
  try {
    await browserAdapter.connect({ mode: 'managed', headless: true });
    await browserAdapter.navigate({ url: 'https://example.com', waitUntil: 'domcontentloaded' });
    await browserAdapter.captureScreenshot({ action: 'test', requirement: 'Initialization test' });
    await browserAdapter.disconnect();
    spinner.succeed('Test page passed');
  } catch (error) {
    spinner.warn(`Test page failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function checkConfig(): Promise<void> {
  const config = configManager.getConfig();
  console.log(`Config loaded from: ${configManager.getLoadedPath() || 'defaults'}`);
  console.log(`Browser mode: ${config.browser.mode}`);
}

async function checkBrowser(): Promise<void> {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    console.log('Managed Chromium: Available');
  } catch {
    console.log('Managed Chromium: Not installed (run "visual-browser-agent browser install")');
  }
}

function printSummary(): void {
  console.log(chalk.bold('\n📋 Summary:'));
  console.log(`  Config: visual-browser-agent.yaml`);
  console.log(`  Browser mode: ${configManager.get('browser.mode')}`);
  console.log(`  Screenshots: ${configManager.get('browser.approvedDirectories.screenshots')}`);
  console.log(`  Recordings: ${configManager.get('browser.approvedDirectories.recordings')}`);
  console.log(`  Downloads: ${configManager.get('browser.approvedDirectories.downloads')}`);
  console.log(`  Uploads: ${configManager.get('browser.approvedDirectories.uploads')}`);
  console.log(chalk.bold('\n🚀 Next steps:'));
  console.log('  1. Add MCP server to your agent config (see "visual-browser-agent host config <host>")');
  console.log('  2. Run "visual-browser-agent mcp" to start the server');
  console.log('  3. Ask your agent: "Study this website\'s visual design and interactions..."');
}
