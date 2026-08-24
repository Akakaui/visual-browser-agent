import { writeFile, readFile } from 'fs/promises';
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
      console.log('\nTo use Chrome with your profiles:');
      console.log('  npx visual-browser-agent mcp --profile "Default"');
    }
  }

  // Install skills
  console.log(chalk.bold('\nInstalling Agent Skills...\n'));
  const skillManager = new SkillManager();
  await skillManager.install('all');

  console.log(chalk.bold('\nSetup complete!\n'));
  console.log(chalk.bold('Quick start:'));
  console.log('  npx visual-browser-agent mcp          # Uses Chromium');
  console.log('  npx visual-browser-agent mcp --profile "Default"  # Uses Chrome');
}
