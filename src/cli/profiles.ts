import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';

export interface ChromeProfile {
  name: string;
  directory: string;
  displayName?: string;
  avatarPath?: string;
  isDefault: boolean;
  lastUsed?: number;
}

const CHROME_USER_DATA_DIR = join(
  process.env['LOCALAPPDATA'] || '',
  'Google',
  'Chrome',
  'User Data'
);

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  join(process.env['LOCALAPPDATA'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe')
];

export function getChromePath(): string | null {
  for (const p of CHROME_PATHS) {
    try {
      require('fs').accessSync(p);
      return p;
    } catch {}
  }
  return null;
}

export async function listProfiles(): Promise<ChromeProfile[]> {
  const profiles: ChromeProfile[] = [];

  try {
    const entries = await readdir(CHROME_USER_DATA_DIR);

    for (const entry of entries) {
      const isProfileDir = entry === 'Default' || /^Profile \d+$/.test(entry);
      if (!isProfileDir) continue;

      const profilePath = join(CHROME_USER_DATA_DIR, entry);
      const profileStats = await stat(profilePath);
      if (!profileStats.isDirectory()) continue;

      let displayName: string | undefined;
      let avatarPath: string | undefined;
      let lastUsed: number | undefined;

      try {
        const prefs = await readFile(join(profilePath, 'Preferences'), 'utf-8');
        const prefsData = JSON.parse(prefs);
        displayName = prefsData?.profile?.name;
        avatarPath = prefsData?.profile?.avatar_icon;
        lastUsed = prefsData?.profile?.last_used;
      } catch {}

      profiles.push({
        name: entry,
        directory: profilePath,
        displayName: displayName || (entry === 'Default' ? 'Default' : entry),
        avatarPath,
        isDefault: entry === 'Default',
        lastUsed: lastUsed ? Number(lastUsed) : undefined
      });
    }
  } catch (err) {
    // Chrome not installed or no profiles
  }

  // Sort: Default first, then by last used
  profiles.sort((a, b) => {
    if (a.isDefault) return -1;
    if (b.isDefault) return 1;
    return (b.lastUsed || 0) - (a.lastUsed || 0);
  });

  return profiles;
}

export async function printProfiles(): Promise<void> {
  const profiles = await listProfiles();

  if (profiles.length === 0) {
    console.log(chalk.yellow('No Chrome profiles found.'));
    console.log('Chrome may not be installed or has no profiles.');
    return;
  }

  console.log(chalk.bold('\nChrome Profiles:\n'));

  for (const profile of profiles) {
    const lastUsed = profile.lastUsed
      ? new Date(profile.lastUsed).toLocaleDateString()
      : 'never';

    const marker = profile.isDefault ? chalk.green(' (default)') : '';
    const last = chalk.dim(`last used: ${lastUsed}`);

    console.log(`  ${chalk.cyan(profile.name)}${marker} - ${profile.displayName} ${last}`);
  }

  console.log(chalk.bold('\nUsage:'));
  console.log('  Use --profile flag with browser connect or mcp commands:');
  console.log('  npx visual-browser-agent mcp --profile "Profile 1"');
}

export async function getProfileDirectory(profileName?: string): Promise<string> {
  if (!profileName) return CHROME_USER_DATA_DIR;

  const profiles = await listProfiles();
  const match = profiles.find(p => p.name === profileName || p.displayName === profileName);

  if (!match) {
    throw new Error(`Profile "${profileName}" not found. Run "visual-browser-agent profiles" to see available profiles.`);
  }

  return match.directory;
}

export function launchChromeWithProfile(
  profileName: string,
  port: number = 9222,
  urls: string[] = []
): void {
  const chromePath = getChromePath();
  if (!chromePath) {
    throw new Error('Chrome not found. Install Chrome or use managed mode.');
  }

  const args = [
    `--remote-debugging-port=${port}`,
    `--profile-directory=${profileName}`,
    '--no-first-run',
    '--no-default-browser-check'
  ];

  if (urls.length > 0) {
    args.push(...urls);
  }

  const { execSync } = require('child_process');
  execSync(`start "" "${chromePath}" ${args.join(' ')}`, { shell: true });
}