import { mkdir, readFile, readdir, stat, rm, cp } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'yaml';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SKILL_DIRS = [
  join(process.cwd(), '.agents', 'skills'),
  join(process.cwd(), '.claude', 'skills'),
  join(process.cwd(), '.cursor', 'skills'),
  join(process.cwd(), '.opencode', 'skills'),
  join(process.env['HOME'] || process.env['USERPROFILE'] || '', '.agents', 'skills'),
  join(process.env['HOME'] || process.env['USERPROFILE'] || '', '.claude', 'skills'),
  join(process.env['HOME'] || process.env['USERPROFILE'] || '', '.cursor', 'skills'),
  join(process.env['HOME'] || process.env['USERPROFILE'] || '', '.opencode', 'skills')
];

const SOURCE_SKILLS_DIR = join(__dirname, '..', '..', 'skills');

export interface SkillManifest {
  name: string;
  description: string;
  version: string;
  triggers?: string[];
  requiredTools?: string[];
  dataScope?: string;
  risk?: 'low' | 'medium' | 'high';
}

export class SkillManager {
  async install(skillName: string, host?: string): Promise<void> {
    const targetDirs = host ? [this.getHostSkillDir(host)] : SKILL_DIRS;

    if (skillName === 'all') {
      const skills = await this.listSourceSkills();
      for (const skill of skills) {
        await this.installSkill(skill, targetDirs);
      }
    } else {
      await this.installSkill(skillName, targetDirs);
    }
  }

  private async installSkill(skillName: string, targetDirs: string[]): Promise<void> {
    const sourceDir = join(SOURCE_SKILLS_DIR, skillName);
    const skillFile = join(sourceDir, 'SKILL.md');

    try {
      await stat(skillFile);
    } catch {
      console.warn(chalk.yellow(`Skill not found: ${skillName}`));
      return;
    }

    for (const targetDir of targetDirs) {
      await mkdir(targetDir, { recursive: true });
      const targetSkillDir = join(targetDir, skillName);
      await mkdir(targetSkillDir, { recursive: true });

      const files = await readdir(sourceDir);
      for (const file of files) {
        await cp(join(sourceDir, file), join(targetSkillDir, file), { recursive: true });
      }

      console.log(chalk.green(`Installed ${skillName} to ${targetDir}`));
    }
  }

  async list(): Promise<void> {
    const sourceSkills = await this.listSourceSkills();
    console.log(chalk.bold('\nAvailable Skills:'));
    for (const skill of sourceSkills) {
      const manifest = await this.readManifest(skill);
      console.log(`  ${skill} - ${manifest?.description || 'No description'}`);
    }

    console.log(chalk.bold('\nInstalled Skills:'));
    for (const dir of SKILL_DIRS) {
      try {
        const entries = await readdir(dir);
        if (entries.length) {
          console.log(`  ${dir}:`);
          for (const entry of entries) {
            console.log(`    ${entry}`);
          }
        }
      } catch {}
    }
  }

  async uninstall(skillName: string): Promise<void> {
    for (const dir of SKILL_DIRS) {
      const skillDir = join(dir, skillName);
      try {
        await rm(skillDir, { recursive: true });
        console.log(chalk.green(`Uninstalled ${skillName} from ${dir}`));
      } catch {}
    }
  }

  private async listSourceSkills(): Promise<string[]> {
    try {
      const entries = await readdir(SOURCE_SKILLS_DIR, { withFileTypes: true });
      return entries.filter(e => e.isDirectory()).map(e => e.name);
    } catch {
      return [];
    }
  }

  private async readManifest(skillName: string): Promise<SkillManifest | null> {
    try {
      const content = await readFile(join(SOURCE_SKILLS_DIR, skillName, 'SKILL.md'), 'utf-8');
      const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
      const fmBody = frontmatter?.[1];
      if (fmBody) {
        return yaml.parse(fmBody) as SkillManifest;
      }
    } catch {}
    return null;
  }

  private getHostSkillDir(host: string): string {
    const hostDirs: Record<string, string> = {
      'claude-code': join(process.cwd(), '.claude', 'skills'),
      'antigravity': join(process.cwd(), '.antigravity', 'skills'),
      'cursor': join(process.cwd(), '.cursor', 'skills'),
      'windsurf': join(process.cwd(), '.windsurf', 'skills'),
      'cline': join(process.cwd(), '.cline', 'skills'),
      'roo': join(process.cwd(), '.roo', 'skills'),
      'kiro': join(process.cwd(), '.kiro', 'skills'),
      'copilot': join(process.cwd(), '.copilot', 'skills'),
      'codex': join(process.cwd(), '.codex', 'skills'),
      'gemini': join(process.cwd(), '.gemini', 'skills'),
      'opencode': join(process.cwd(), '.opencode', 'skills'),
      'goose': join(process.cwd(), '.goose', 'skills')
    };
    return hostDirs[host] || join(process.cwd(), '.agents', 'skills');
  }
}