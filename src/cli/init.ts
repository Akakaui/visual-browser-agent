import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';
import { isChromeInstalled, listProfiles } from './profiles.js';
import { SkillManager } from '../skills/manager.js';

const CONFIG_TEMPLATE = '# Visual Browser Agent Configuration\n' +
  'browser:\n' +
  '  # chromium: Use Playwright Chromium (default, works everywhere)\n' +
  '  # chrome: Use existing Chrome with your profiles\n' +
  '  mode: chromium\n' +
  '\n' +
  '  # Chrome profile to use (only if mode: chrome)\n' +
  '  # Run: npx visual-browser-agent profiles\n' +
  '  # profile: Default\n' +
  '\n' +
  '  # Chrome debug port (only if mode: chrome)\n' +
  '  port: 9222\n' +
  '\n' +
  'observation:\n' +
  '  default_viewports:\n' +
  '    - name: desktop\n' +
  '      width: 1280\n' +
  '      height: 720\n' +
  '    - name: mobile\n' +
  '      width: 375\n' +
  '      height: 667\n' +
  '  captureAnimations: true\n' +
  '\n' +
  'retention:\n' +
  '  maxAgeDays: 30\n' +
  '  maxRunHistorySize: 200\n';

// Detect which coding agent is being used
function detectAgent(): string | null {
  const { existsSync } = require('fs');

  // Check for common agent config directories
  if (existsSync('.claude')) return 'claude-code';
  if (existsSync('.cursor')) return 'cursor';
  if (existsSync('.gemini')) return 'gemini';
  if (existsSync('.opencode')) return 'opencode';
  if (existsSync('.antigravity')) return 'antigravity';
  if (existsSync('.windsurf')) return 'windsurf';
  if (existsSync('.cline')) return 'cline';
  if (existsSync('.roo')) return 'roo';
  if (existsSync('.kiro')) return 'kiro';
  if (existsSync('.copilot')) return 'copilot';
  if (existsSync('.codex')) return 'codex';
  if (existsSync('.goose')) return 'goose';

  return null;
}

// Install universal wrapper for detected agent
async function installUniversalWrapper(agent: string): Promise<void> {
  const agentDirs: Record<string, string> = {
    'claude-code': '.claude/agents',
    'cursor': '.cursor/agents',
    'gemini': '.gemini/agents',
    'opencode': '.opencode/agents',
    'antigravity': '.antigravity/agents',
    'windsurf': '.windsurf/agents',
    'cline': '.cline/agents',
    'roo': '.roo/agents',
    'kiro': '.kiro/agents',
    'copilot': '.copilot/agents',
    'codex': '.codex/agents',
    'goose': '.goose/agents'
  };

  const agentDir = agentDirs[agent] || '.agents';
  const destDir = join(process.cwd(), agentDir);
  await mkdir(destDir, { recursive: true });

  // Read universal wrapper
  const wrapperPath = join(__dirname, '../../wrappers/universal/visual-browser-specialist.md');
  try {
    const template = await readFile(wrapperPath, 'utf-8');
    const dest = join(destDir, 'visual-browser-specialist.md');
    await writeFile(dest, template, 'utf-8');
    console.log(chalk.green('Installed visual-browser-specialist for ' + agent));
  } catch {
    console.log(chalk.yellow('Could not install universal wrapper'));
  }
}

export async function initProject(mode: string = 'chromium'): Promise<void> {
  console.log(chalk.bold('\nVisual Browser Agent - Init\n'));

  const configPath = join(process.cwd(), 'visual-browser-agent.config.yaml');

  // Check if config exists
  try {
    await readFile(configPath, 'utf-8');
    console.log(chalk.dim('Config already exists, skipping...'));
  } catch {
    // Write default config
    await writeFile(configPath, CONFIG_TEMPLATE, 'utf-8');
    console.log(chalk.green('Created visual-browser-agent.config.yaml'));
  }

  // Install Chromium (default)
  console.log(chalk.bold('\nInstalling Chromium...\n'));
  try {
    const { execSync } = await import('child_process');
    execSync('npx playwright install chromium', { stdio: 'inherit', timeout: 120000 });
    console.log(chalk.green('Chromium installed!'));
  } catch {
    console.log(chalk.yellow('Could not install Chromium automatically.'));
    console.log('Run manually: npx playwright install chromium');
  }

  // Check Chrome (optional)
  if (isChromeInstalled()) {
    console.log(chalk.green('\nChrome detected (optional)'));
    const profiles = await listProfiles();
    console.log('  ' + profiles.length + ' profile(s) available');

    if (profiles.length > 0) {
      console.log(chalk.bold('\nChrome Profiles:'));
      profiles.forEach(p => console.log('  ' + chalk.cyan(p.name) + ' - ' + (p.displayName || p.name)));
    }
  }

  // Detect and configure for coding agent
  const agent = detectAgent();
  if (agent) {
    console.log(chalk.bold('\nDetected coding agent: ' + agent));
    await installUniversalWrapper(agent);
  } else {
    console.log(chalk.dim('\nNo coding agent detected.'));
    console.log('To install for your agent, run:');
    console.log('  npx visual-browser-agent host <agent-name>');
  }

  // Install skills
  console.log(chalk.bold('\nInstalling Agent Skills...\n'));
  const skillManager = new SkillManager();
  await skillManager.install('all');

  console.log(chalk.bold('\nSetup complete!\n'));
  console.log(chalk.bold('Quick start:'));
  console.log('  npx visual-browser-agent mcp          # Uses Chromium');
  console.log('  npx visual-browser-agent mcp --extension  # Uses Chrome');
}
