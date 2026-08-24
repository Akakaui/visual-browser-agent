#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));

const program = new Command();

program
  .name('visual-browser-agent')
  .description('Visual Browser Agent - MCP server, CLI tools, and Chrome extension')
  .version(pkg.version);

// Profiles command
program
  .command('profiles')
  .description('List Chrome profiles (for extension mode)')
  .action(async () => {
    const { printProfiles, isChromeInstalled } = await import('../cli/profiles.js');
    if (!isChromeInstalled()) {
      console.log('Chrome not found. Profiles are only available for Chrome extension mode.');
      console.log('For Chromium (default), no profiles are needed.');
      return;
    }
    await printProfiles();
  });

// Connect command
program
  .command('connect')
  .description('Connect to a browser')
  .option('--extension', 'Connect to Chrome via extension (instead of Chromium)')
  .option('--url <url>', 'URL to open')
  .action(async (options) => {
    const { chromium } = await import('playwright');
    const { connectToRunningChrome } = await import('../cli/profiles.js');

    if (options.extension) {
      // Extension mode: connect to running Chrome
      const running = await connectToRunningChrome(9222);
      if (running) {
        console.log('Connected to Chrome via extension');
      } else {
        console.log('Chrome not detected. Make sure Chrome is open with remote debugging enabled.');
        console.log('Or install the Chrome extension from: browser-extension/');
      }
      return;
    }

    // Default: Use Chromium
    console.log('Using Chromium (Playwright)...');
    try {
      const browser = await chromium.launch({ headless: false });
      const page = await browser.newPage();
      await page.goto(options.url || 'https://example.com');
      console.log('Chromium launched!');
      console.log('Browser is ready for your AI agent.');
    } catch (err) {
      console.error('Failed to launch Chromium: ' + (err instanceof Error ? err.message : String(err)));
      console.log('Run: npx playwright install chromium');
    }
  });

// MCP Server command
program
  .command('mcp')
  .description('Start MCP server')
  .option('--http <port>', 'HTTP port for Streamable HTTP transport')
  .option('--extension', 'Connect to Chrome via extension (instead of Chromium)')
  .option('--cdp-port <port>', 'Chrome debug port (default: 9222)')
  .action(async (options) => {
    const { startMCPServer } = await import('../mcp/server.js');
    const { getDebugPort } = await import('../cli/profiles.js');

    let cdpPort = options.cdpPort ? parseInt(options.cdpPort) : 9222;

    if (options.extension) {
      // Extension mode: connect to running Chrome
      const existingPort = await getDebugPort();
      if (existingPort) {
        cdpPort = existingPort;
      }
    }

    await startMCPServer(options.http ? parseInt(options.http) : undefined, { cdpPort });
  });

// Doctor command
program
  .command('doctor')
  .description('Check environment')
  .action(async () => {
    const { isChromeInstalled, getChromePath, listProfiles, getDebugPort } = await import('../cli/profiles.js');
    console.log('\nEnvironment:\n');

    // Chromium
    console.log('  Chromium: Available (via Playwright)');

    // Chrome
    if (isChromeInstalled()) {
      console.log('  Chrome: ' + getChromePath());
      const profiles = await listProfiles();
      console.log('    Profiles: ' + profiles.length);
    } else {
      console.log('  Chrome: Not found (extension mode unavailable)');
    }

    // Running Chrome
    const runningPort = await getDebugPort();
    if (runningPort) {
      console.log('  Chrome running: Yes (port ' + runningPort + ')');
    } else {
      console.log('  Chrome running: No');
    }
  });

// Init command
program
  .command('init')
  .description('Initialize project config and skills')
  .option('--mode <mode>', 'Browser mode: chrome | managed', 'chrome')
  .action(async (options) => {
    const { initProject } = await import('../cli/init.js');
    await initProject(options.mode);
  });

// Skill command
program
  .command('skill')
  .description('Manage Agent Skills')
  .argument('<action>', 'install | list | uninstall')
  .argument('[skill]', 'Skill name (or "all")')
  .option('--host <host>', 'Target host (claude-code, antigravity, cursor)')
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
        if (!skill) {
          console.error(chalk.red('Specify skill to uninstall'));
          return;
        }
        await manager.uninstall(skill);
        break;
    }
  });

// Host command
program
  .command('host')
  .description('Generate host integration configs')
  .argument('[host]', 'Host name (claude-code, cursor, antigravity, opencode, etc.)')
  .action(async (host) => {
    const { HostManager } = await import('../cli/host-manager.js');
    const manager = new HostManager();
    if (host) {
      await manager.install(host);
    } else {
      console.log('Supported agents:');
      console.log('  claude-code, cursor, gemini, opencode, antigravity,');
      console.log('  windsurf, cline, roo, kiro, copilot, codex, goose');
      console.log('\nUsage: npx visual-browser-agent host <agent-name>');
    }
  });

// Browser command (dev/testing)
program
  .command('browser')
  .description('Launch browser directly (dev/testing)')
  .argument('[url]', 'URL to open', 'https://example.com')
  .action(async (url) => {
    const { chromium } = await import('playwright');

    console.log('Launching Chromium...');
    try {
      const browser = await chromium.launch({ headless: false });
      const page = await browser.newPage();
      await page.goto(url);
      console.log('Chromium launched!');
    } catch (err) {
      console.error('Failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  });

program.parse();
