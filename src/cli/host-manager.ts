import { accessSync } from 'fs';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const HOST_CONFIGS: Record<string, any> = {
  'claude-code': {
    mcp: {
      command: 'npx',
      args: ['visual-browser-agent', 'mcp'],
      env: {}
    },
    permissions: {
      allow: ['mcp(visual-browser/inspect_page)', 'mcp(visual-browser/capture_screenshot)'],
      ask: ['mcp(visual-browser/navigate)', 'mcp(visual-browser/click)', 'mcp(visual-browser/fill)', 'mcp(visual-browser/upload_file)', 'mcp(visual-browser/download_file)'],
      deny: ['mcp(visual-browser/submit_public_action)']
    },
    skillsDir: '.claude/skills'
  },
  'antigravity': {
    mcp: {
      command: 'npx',
      args: ['visual-browser-agent', 'mcp'],
      env: {}
    },
    permissions: {
      read_url: ['*'],
      execute_url: ['*'],
      mcp: {
        'visual-browser/inspect_page': 'allow',
        'visual-browser/capture_screenshot': 'allow',
        'visual-browser/navigate': 'ask',
        'visual-browser/click': 'ask',
        'visual-browser/fill': 'ask',
        'visual-browser/upload_file': 'ask',
        'visual-browser/download_file': 'ask',
        'visual-browser/submit_public_action': 'deny'
      }
    },
    skillsDir: '.agents/skills'
  },
  'cursor': {
    mcp: {
      command: 'npx',
      args: ['visual-browser-agent', 'mcp'],
      env: {}
    },
    skillsDir: '.cursor/skills'
  },
  'windsurf': {
    mcp: {
      command: 'npx',
      args: ['visual-browser-agent', 'mcp'],
      env: {}
    },
    skillsDir: '.windsurf/skills'
  },
  'cline': {
    mcp: {
      command: 'npx',
      args: ['visual-browser-agent', 'mcp'],
      env: {}
    },
    autoApprove: ['mcp(visual-browser/inspect_page)', 'mcp(visual-browser/capture_screenshot)'],
    skillsDir: '.cline/skills'
  },
  'roo': {
    mcp: {
      command: 'npx',
      args: ['visual-browser-agent', 'mcp'],
      env: {}
    },
    skillsDir: '.roo/skills'
  },
  'kiro': {
    mcp: {
      command: 'npx',
      args: ['visual-browser-agent', 'mcp'],
      env: {}
    },
    skillsDir: '.kiro/skills'
  },
  'copilot': {
    mcp: {
      command: 'npx',
      args: ['visual-browser-agent', 'mcp'],
      env: {}
    },
    skillsDir: '.copilot/skills'
  },
  'codex': {
    mcp: {
      command: 'npx',
      args: ['visual-browser-agent', 'mcp'],
      env: {}
    },
    approval: {
      'mcp(visual-browser/inspect_page)': 'auto',
      'mcp(visual-browser/capture_screenshot)': 'auto',
      'mcp(visual-browser/navigate)': 'prompt',
      'mcp(visual-browser/click)': 'prompt',
      'mcp(visual-browser/fill)': 'prompt',
      'mcp(visual-browser/submit_public_action)': 'approve'
    },
    skillsDir: '.codex/skills'
  },
  'gemini': {
    mcp: {
      command: 'npx',
      args: ['visual-browser-agent', 'mcp'],
      env: {}
    },
    skillsDir: '.gemini/skills'
  },
  'opencode': {
    mcp: {
      command: 'npx',
      args: ['visual-browser-agent', 'mcp'],
      env: {}
    },
    skillsDir: '.opencode/skills'
  },
  'goose': {
    mcp: {
      command: 'npx',
      args: ['visual-browser-agent', 'mcp'],
      env: {}
    },
    skillsDir: '.goose/skills'
  }
};

export class HostManager {
  async install(host: string): Promise<void> {
    const config = HOST_CONFIGS[host];
    if (!config) {
      throw new Error(`Unknown host: ${host}. Available: ${Object.keys(HOST_CONFIGS).join(', ')}`);
    }

    console.log(chalk.bold(`\n📦 Installing for ${host}...`));

    if (config.skillsDir) {
      const skillsDir = join(process.cwd(), config.skillsDir);
      await mkdir(skillsDir, { recursive: true });
      console.log(`  Skills directory: ${skillsDir}`);
    }

    await this.generateMCPConfig(host, config);
    await this.generatePermissions(host, config);
    await this.generateSkillInstallScript(host);
    await this.installWrapper(host);

    console.log(chalk.green(`\n✅ ${host} installation complete!`));
    console.log(chalk.bold('\nNext steps:'));
    console.log(`  1. Restart your ${host} client`);
    console.log(`  2. Run "visual-browser-agent mcp" to test the server`);
    console.log(`  3. Ask your agent to use the visual browser tools`);
  }

  async generateConfig(host: string): Promise<void> {
    const config = HOST_CONFIGS[host];
    if (!config) {
      throw new Error(`Unknown host: ${host}`);
    }

    console.log(chalk.bold(`\n📄 ${host} Configuration:`));
    console.log(JSON.stringify(config, null, 2));
  }

    private async generateMCPConfig(host: string, config: any): Promise<void> {
    const mcpConfig = host === 'opencode'
      ? {
          mcp: {
            'visual-browser': {
              type: 'local',
              command: ['npx', 'visual-browser-agent', 'mcp'],
              enabled: true
            }
          }
        }
      : {
          mcpServers: {
            'visual-browser': config.mcp
          }
        };
    const configPath = join(process.cwd(), `.vba-mcp-${host}.json`);
    await writeFile(configPath, JSON.stringify(mcpConfig, null, 2), 'utf-8');
    console.log(`  MCP config: ${configPath}`);
  }

  private async generatePermissions(host: string, config: any): Promise<void> {
    if (!config.permissions && !config.autoApprove && !config.approval) return;

    const permConfig: any = {};
    if (config.permissions) permConfig.permissions = config.permissions;
    if (config.autoApprove) permConfig.autoApprove = config.autoApprove;
    if (config.approval) permConfig.approval = config.approval;

    const configPath = join(process.cwd(), `.vba-permissions-${host}.json`);
    await writeFile(configPath, JSON.stringify(permConfig, null, 2), 'utf-8');
    console.log(`  Permissions config: ${configPath}`);
  }

  private getWrapperPath(host: string): string | null {
    // Use universal wrapper for all hosts
    const universalWrapper = join(PACKAGE_ROOT, 'wrappers', 'universal', 'visual-browser-specialist.md');
    const hostWrapper = join(PACKAGE_ROOT, 'wrappers', host, 'visual-browser-specialist.md');

    // Check if host-specific wrapper exists, otherwise use universal
    const hostSpecificPath = hostWrapper;
    try {
      accessSync(hostSpecificPath);
      return hostSpecificPath;
    } catch {
      // Use universal wrapper
    }

    const universalPath = universalWrapper;
    try {
      accessSync(universalPath);
      return universalPath;
    } catch {
      return null;
    }
  }

  private async installWrapper(host: string): Promise<void> {
    const wrapperPath = this.getWrapperPath(host);
    if (!wrapperPath) return;

    const agentDirs: Record<string, string> = {
      'claude-code': '.claude/agents',
      'cursor': '.cursor/agents',
      'gemini': '.gemini/agents',
      'opencode': '.opencode/agents',
      'antigravity': '.agents/agents',
      'windsurf': '.windsurf/agents',
      'cline': '.cline/agents',
      'roo': '.roo/agents',
      'kiro': '.kiro/agents',
      'copilot': '.copilot/agents',
      'codex': '.codex/agents',
      'goose': '.goose/agents'
    };
    const agentDir = agentDirs[host] || '.agents';
    const destDir = join(process.cwd(), agentDir);
    await mkdir(destDir, { recursive: true });

    let template: string;
    try {
      template = await readFile(wrapperPath, 'utf-8');
    } catch {
      console.log(chalk.yellow(`  Subagent wrapper template missing: ${wrapperPath}`));
      return;
    }

    const dest = join(destDir, 'visual-browser-specialist.md');
    await writeFile(dest, template, 'utf-8');
    console.log(chalk.green(`  Browser specialist: ${dest}`));

    if (host === 'opencode') {
      const primaryPath = join(PACKAGE_ROOT, 'wrappers', 'opencode', 'visual-browser-agent.md');
      try {
        const primaryTemplate = await readFile(primaryPath, 'utf-8');
        const primaryDest = join(destDir, 'visual-browser-agent.md');
        await writeFile(primaryDest, primaryTemplate, 'utf-8');
        console.log(chalk.green(`  Primary browser agent: ${primaryDest}`));
      } catch {
        console.log(chalk.yellow(`  Primary browser agent template missing: ${primaryPath}`));
      }
    }
  }

  private async generateSkillInstallScript(host: string): Promise<void> {
    const config = HOST_CONFIGS[host];
    if (!config.skillsDir) return;

    const script = `#!/bin/bash
# Auto-generated skill installer for ${host}
npx visual-browser-agent skill install all --host ${host}
`;

    const scriptPath = join(process.cwd(), `install-skills-${host}.sh`);
    await writeFile(scriptPath, script, 'utf-8');
    console.log(`  Skill installer: ${scriptPath}`);
  }

  listHosts(): string[] {
    return Object.keys(HOST_CONFIGS);
  }
}