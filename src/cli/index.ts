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
  .description('List Chrome profiles on this machine')
  .action(async () => {
    const { printProfiles, isChromeInstalled } = await import('../cli/profiles.js');
    if (!isChromeInstalled()) {
      console.log(chalk.yellow('Chrome not found. Install Chrome or use Chromium mode.'));
      console.log('  npm install playwright');
      console.log('  npx visual-browser-agent init --mode managed');
      return;
    }
    await printProfiles();
  });

// Connect command
program
  .command('connect')
  .description('Launch Chrome with a profile and connect')
  .option('--profile <name>', 'Chrome profile name (Default, Profile 1, etc.)')
  .option('--port <port>', 'Debug port (default: 9222)')
  .option('--url <url>', 'URL to open')
  .action(async (options) => {
    const { isChromeInstalled, launchChromeWithProfile, listProfiles, connectToRunningChrome } = await import('../cli/profiles.js');

    if (!isChromeInstalled()) {
      console.log(chalk.red('Chrome not found.'));
      console.log('Install Chrome or use: npx visual-browser-agent init --mode managed');
      return;
    }

    const port = options.port ? parseInt(options.port) : 9222;

    // Check if Chrome is already running
    const running = await connectToRunningChrome(port);
    if (running) {
      console.log('Using existing Chrome on port ' + port);
      console.log('\nAdd to your MCP config:');
      console.log('  "env": { "VBA_CDP_PORT": "' + port + '" }');
      return;
    }

    // If no profile specified, list profiles and ask
    if (!options.profile) {
      const profiles = await listProfiles();
      if (profiles.length === 0) {
        console.log(chalk.yellow('No Chrome profiles found.'));
        return;
      }
      if (profiles.length === 1) {
        options.profile = profiles[0]?.name || 'Default';
        console.log('Using only profile: ' + options.profile);
      } else {
        console.log(chalk.bold('\nAvailable profiles:\n'));
        profiles.forEach((p, i) => {
          console.log('  ' + chalk.cyan(String(i + 1)) + ' ' + p.name + ' - ' + (p.displayName || p.name));
        });
        console.log('\nRun with: --profile "' + (profiles[0]?.name || 'Default') + '"');
        return;
      }
    }

    try {
      const url = options.url || 'about:blank';
      await launchChromeWithProfile(options.profile, port, [url]);
      console.log(chalk.green('\nConnected!'));
      console.log('\nAdd to your MCP config:');
      console.log('  "env": { "VBA_CDP_PORT": "' + port + '" }');
    } catch (err) {
      console.error(chalk.red('Error: ' + (err instanceof Error ? err.message : String(err))));
    }
  });

// MCP Server command
program
  .command('mcp')
  .description('Start MCP server')
  .option('--http <port>', 'HTTP port for Streamable HTTP transport')
  .option('--profile <name>', 'Chrome profile (launches Chrome if not running)')
  .option('--cdp-port <port>', 'Chrome debug port (default: 9222)')
  .action(async (options) => {
    const { startMCPServer } = await import('../mcp/server.js');
    const { isChromeInstalled, launchChromeWithProfile, getDebugPort } = await import('../cli/profiles.js');

    let cdpPort = options.cdpPort ? parseInt(options.cdpPort) : 9222;

    if (options.profile) {
      if (!isChromeInstalled()) {
        console.log(chalk.yellow('Chrome not found. Using Chromium...'));
        await startMCPServer(options.http ? parseInt(options.http) : undefined);
        return;
      }

      try {
        cdpPort = await launchChromeWithProfile(options.profile, cdpPort);
      } catch (err) {
        console.error(chalk.red('Failed: ' + (err instanceof Error ? err.message : String(err))));
        process.exit(1);
      }
    } else {
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
    console.log(chalk.bold('\nEnvironment:\n'));

    // Chrome
    if (isChromeInstalled()) {
      console.log('  ' + chalk.green('OK') + ' Chrome: ' + getChromePath());
      const profiles = await listProfiles();
      console.log('    Profiles: ' + profiles.length);
      profiles.forEach(p => console.log('      ' + p.name + ' - ' + p.displayName));
    } else {
      console.log('  ' + chalk.yellow('--') + ' Chrome: not found (Chromium will be used)');
    }

    // Running Chrome
    const runningPort = await getDebugPort();
    if (runningPort) {
      console.log('  ' + chalk.green('OK') + ' Chrome running on port ' + runningPort);
    } else {
      console.log('  ' + chalk.dim('--') + ' No Chrome running');
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
  .argument('[host]', 'Host name (claude-code, cursor, etc.)')
  .action(async (host) => {
    const { HostManager } = await import('../cli/host-manager.js');
    const manager = new HostManager();
    if (host) {
      await manager.install(host);
    } else {
      console.log('Specify a host: claude-code, cursor, antigravity, etc.');
    }
  });

// Browser command (dev/testing)
program
  .command('browser')
  .description('Launch browser directly (dev/testing)')
  .argument('[url]', 'URL to open', 'https://example.com')
  .action(async (url) => {
    const { launchChromeWithProfile, isChromeInstalled, listProfiles } = await import('../cli/profiles.js');
    const { BrowserAdapter } = await import('../adapter/browser-adapter.js');

    if (isChromeInstalled()) {
      const profiles = await listProfiles();
      const profile = profiles.length > 0 ? profiles[0]?.name || 'Default' : 'Default';
      console.log('Launching Chrome with profile "' + profile + '"...');
      await launchChromeWithProfile(profile, 9222, [url]);
    } else {
      console.log('Chrome not found, using Chromium...');
      const adapter = new BrowserAdapter();
      await adapter.connect({ mode: 'managed' });
      await adapter.navigate(url);
    }
  });

program.parse();
