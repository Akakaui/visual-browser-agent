import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';
import { isChromeInstalled, listProfiles } from './profiles.js';
import { SkillManager } from '../skills/manager.js';

const CONFIG_TEMPLATE = '# Visual Browser Agent Configuration\n' +
  'browser:\n' +
  '  # chrome: Use existing Chrome with your profiles (default)\n' +
  '  # managed: Use Chromium (Playwright)\n' +
  '  mode: chrome\n' +
  '\n' +
  '  # Chrome profile to use (run: npx visual-browser-agent profiles)\n' +
  '  # profile: Default\n' +
  '\n' +
  '  # Chrome debug port\n' +
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

export async function initProject(mode: string = 'chrome'): Promise<void> {
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

  // Check Chrome
  if (isChromeInstalled()) {
    console.log(chalk.green('Chrome found'));
    const profiles = await listProfiles();
    console.log('  ' + profiles.length + ' profile(s) available');

    if (profiles.length > 0) {
      console.log(chalk.bold('\nProfiles:'));
      profiles.forEach(p => console.log('  ' + chalk.cyan(p.name) + ' - ' + (p.displayName || p.name)));
      const firstName = profiles[0]?.name || 'Default';
      console.log('\nUse: npx visual-browser-agent mcp --profile "' + firstName + '"');
    }
  } else {
    console.log(chalk.yellow('Chrome not found'));
    console.log('  Chromium will be used (run: npx playwright install chromium)');
    console.log('\nUse: npx visual-browser-agent mcp');
  }

  // Install skills
  console.log(chalk.bold('\nInstalling Agent Skills...\n'));
  const skillManager = new SkillManager();
  await skillManager.install('all');

  console.log(chalk.bold('\nSetup complete!\n'));

  if (isChromeInstalled()) {
    const profiles = await listProfiles();
    if (profiles.length > 0) {
      const firstName = profiles[0]?.name || 'Default';
      console.log(chalk.bold('Quick start:'));
      console.log('  npx visual-browser-agent mcp --profile "' + firstName + '"');
    }
  } else {
    console.log(chalk.bold('Quick start:'));
    console.log('  npx visual-browser-agent mcp');
  }
}
