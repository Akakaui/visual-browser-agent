import { readdir, readFile, stat } from 'fs/promises';
import { accessSync } from 'fs';
import { homedir, platform } from 'os';
import { join } from 'path';
import { spawn, execSync } from 'child_process';
import chalk from 'chalk';

export interface ChromeProfile {
  name: string;
  directory: string;
  displayName?: string;
  accountEmail?: string;
  isDefault: boolean;
  lastUsed?: number;
}

function getChromeUserDataDir(): string {
  if (platform() === 'win32') {
    return join(process.env['LOCALAPPDATA'] || join(homedir(), 'AppData', 'Local'), 'Google', 'Chrome', 'User Data');
  }
  if (platform() === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'Google', 'Chrome');
  }
  return join(process.env['XDG_CONFIG_HOME'] || join(homedir(), '.config'), 'google-chrome');
}

function getChromePathCandidates(): string[] {
  if (platform() === 'win32') {
    return [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      join(process.env['LOCALAPPDATA'] || join(homedir(), 'AppData', 'Local'), 'Google', 'Chrome', 'Application', 'chrome.exe')
    ];
  }
  if (platform() === 'darwin') {
    return ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', join(homedir(), 'Applications', 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome')];
  }
  return ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
}

const CHROME_USER_DATA = getChromeUserDataDir();

// ── Chrome Detection ──────────────────────────────────────────────────────────

export function getChromePath(): string | null {
  for (const p of getChromePathCandidates()) {
    try {
      accessSync(p);
      return p;
    } catch {}
  }
  if (platform() !== 'win32') {
    for (const command of ['google-chrome-stable', 'google-chrome', 'chromium', 'chromium-browser']) {
      try {
        return execSync(`command -v ${command}`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null;
      } catch {}
    }
  }
  return null;
}

export function isChromeInstalled(): boolean {
  return getChromePath() !== null;
}

// ── Profile Listing ───────────────────────────────────────────────────────────

export async function listProfiles(): Promise<ChromeProfile[]> {
  const profiles: ChromeProfile[] = [];
  let profileInfoCache: Record<string, { name?: string; user_name?: string; gaia_name?: string }> = {};

  try {
    const localState = JSON.parse(await readFile(join(CHROME_USER_DATA, 'Local State'), 'utf-8'));
    profileInfoCache = localState?.profile?.info_cache || {};
  } catch {}

  try {
    const entries = await readdir(CHROME_USER_DATA);

    for (const entry of entries) {
      if (entry !== 'Default' && !/^Profile \d+$/.test(entry)) continue;

      const profilePath = join(CHROME_USER_DATA, entry);
      const s = await stat(profilePath);
      if (!s.isDirectory()) continue;

      let displayName: string | undefined;
      let accountEmail: string | undefined;
      let lastUsed: number | undefined;
      const cachedInfo = profileInfoCache[entry];
      displayName = cachedInfo?.name;
      accountEmail = cachedInfo?.user_name || cachedInfo?.gaia_name;

      try {
        const prefs = JSON.parse(await readFile(join(profilePath, 'Preferences'), 'utf-8'));
        displayName = prefs?.profile?.name || displayName;
        const accountInfo = prefs?.account_info?.[0];
        accountEmail = (typeof accountInfo?.email === 'string' ? accountInfo.email : undefined) || accountEmail;
        lastUsed = prefs?.profile?.last_used ? Number(prefs.profile.last_used) : undefined;
      } catch {}

      profiles.push({
        name: entry,
        directory: profilePath,
        displayName: displayName || (entry === 'Default' ? 'Default' : entry),
        accountEmail,
        isDefault: entry === 'Default',
        lastUsed
      });
    }
  } catch {}

  profiles.sort((a, b) => {
    if (a.isDefault) return -1;
    if (b.isDefault) return 1;
    return (b.lastUsed || 0) - (a.lastUsed || 0);
  });

  return profiles;
}

export async function chooseChromeProfile(): Promise<string | null> {
  const profiles = await listProfiles();
  if (profiles.length === 0) {
    throw new Error('No Chrome profiles found. Open Chrome once and sign in to a profile, then try again.');
  }

  console.log(chalk.bold('\nChoose the Chrome account to use:\n'));
  profiles.forEach((profile, index) => {
    const identity = profile.accountEmail || profile.displayName || profile.name;
    const suffix = profile.displayName && profile.accountEmail ? ` — ${profile.displayName}` : '';
    console.log(`  ${index + 1}. ${identity}${suffix}`);
  });

  const readline = await import('readline/promises');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question('\nEnter a number (or type the account/profile name): ')).trim();
    const index = Number(answer) - 1;
    if (Number.isInteger(index) && profiles[index]) return profiles[index].name;
    const normalized = answer.toLowerCase();
    const match = profiles.find(profile => [profile.name, profile.displayName, profile.accountEmail].filter(Boolean).some(value => value!.toLowerCase() === normalized));
    if (match) return match.name;
    throw new Error('Profile choice not recognized. Run "visual-browser-agent profiles" to see available identities.');
  } finally {
    rl.close();
  }
}

export async function printProfiles(): Promise<void> {
  const profiles = await listProfiles();

  if (profiles.length === 0) {
    console.log(chalk.yellow('No Chrome profiles found.'));
    return;
  }

  console.log(chalk.bold('\nChrome Profiles:\n'));

  for (const p of profiles) {
    const last = p.lastUsed ? new Date(p.lastUsed).toLocaleDateString() : 'never used';
    const tag = p.isDefault ? chalk.green(' [default]') : '';
    const name = p.displayName || 'no name';

    // Show profile name + display name so user knows which is which
    console.log('  ' + chalk.cyan(p.name) + tag);
    console.log('    Name: ' + name);
    if (p.accountEmail) console.log('    Account: ' + p.accountEmail);
    console.log('    Last: ' + last);
    console.log('');
  }

  console.log(chalk.bold('Usage:'));
  console.log('  Use the profile name (Default, Profile 2, etc.) with --profile flag');
  console.log('  Example: npx visual-browser-agent mcp --profile "Profile 3"');
}

// ── Chrome Launch ─────────────────────────────────────────────────────────────

/**
 * Kill any Chrome using a debug port, then launch Chrome with profile.
 * Returns the debug port.
 */
export async function launchChromeWithProfile(
  profileName: string,
  port: number = 9222,
  urls: string[] = ['about:blank']
): Promise<number> {
  const chromePath = getChromePath();
  if (!chromePath) {
    throw new Error(
      'Chrome not found.\n' +
      'Install Chrome: https://www.google.com/chrome/\n' +
      'Or use Chromium: npx visual-browser-agent init --mode managed'
    );
  }

  // Validate profile
  const profiles = await listProfiles();
  const requested = profileName.toLowerCase();
  const profile = profiles.find(p => [p.name, p.displayName, p.accountEmail].filter(Boolean).some(value => value!.toLowerCase() === requested));
  if (!profile) {
    throw new Error(
      `Profile "${profileName}" not found.\n` +
      'Run "visual-browser-agent profiles" to list available profiles.'
    );
  }

  // Kill existing Chrome on this port if any
  await killChromeOnPort(port);

  // Launch Chrome
  const args = [
    `--remote-debugging-port=${port}`,
    `--profile-directory=${profileName}`,
    '--no-first-run',
    '--no-default-browser-check',
    ...urls
  ];

  const child = spawn(chromePath, args, {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();

  // Wait for debug port to open
  await waitForPort(port, 15000);

  console.log(chalk.green(`Chrome launched with profile "${profileName}" on port ${port}`));
  return port;
}

/**
 * Connect to an already-running Chrome with remote debugging.
 */
export async function connectToRunningChrome(port: number = 9222): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${port}/json/version`);
    if (res.ok) {
      const data = await res.json() as { Browser?: string };
      console.log(chalk.green(`Connected to Chrome on port ${port} (${data.Browser || 'unknown'})`));
      return true;
    }
  } catch {}
  return false;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function killChromeOnPort(port: number): Promise<void> {
  try {
    // Find processes using the port
    const command = platform() === 'win32'
      ? `netstat -ano | findstr :${port} | findstr LISTENING`
      : `lsof -ti tcp:${port} -sTCP:LISTEN || true`;
    const output = execSync(command, {
      encoding: 'utf-8',
      timeout: 5000
    }).trim();

    if (!output) return;

    // Extract PIDs and kill them
    const pids = [...new Set(output.split('\n').map(line => platform() === 'win32' ? line.trim().split(/\s+/).pop() : line.trim()).filter(Boolean))];
    for (const pid of pids) {
      try {
        if (platform() === 'win32') execSync(`taskkill /PID ${pid} /F`, { timeout: 5000, stdio: 'ignore' });
        else execSync(`kill ${pid}`, { timeout: 5000, stdio: 'ignore' });
      } catch {}
    }

    // Wait for port to free up
    await new Promise(r => setTimeout(r, 1000));
  } catch {}
}

async function waitForPort(port: number, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://localhost:${port}/json/version`);
      if (res.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error(`Chrome did not start on port ${port} within ${timeoutMs}ms`);
}

export async function getDebugPort(): Promise<number | null> {
  for (const port of [9222, 9223, 9224, 9225]) {
    try {
      const res = await fetch(`http://localhost:${port}/json/version`);
      if (res.ok) return port;
    } catch {}
  }
  return null;
}
