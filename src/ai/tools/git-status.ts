import { Tool, ToolResult } from './index';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitStatusTool implements Tool {
  name = 'git_status';
  description = 'Git durumunu göster';

  definition = {
    name: 'git_status',
    description: 'Git repository durumunu gösterir. Değişen, eklenen ve silinen dosyaları listeler.',
    parameters: {
      workingDirectory: {
        type: 'string' as const,
        description: 'Çalışma dizini (Git repo kök dizini)',
      }
    },
    execute: async (params: Record<string, any>): Promise<ToolResult> => {
      return this.execute(params);
    }
  };

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { workingDirectory } = params;

    try {
      const { stdout } = await execAsync('git status --porcelain', {
        cwd: workingDirectory,
        timeout: 10000,
        encoding: 'utf-8'
      });

      const { stdout: branchOut } = await execAsync('git branch --show-current', {
        cwd: workingDirectory,
        timeout: 5000,
        encoding: 'utf-8'
      });

      const branch = branchOut.trim();
      const lines = stdout.trim().split('\n').filter(Boolean);

      const staged: string[] = [];
      const modified: string[] = [];
      const untracked: string[] = [];
      const deleted: string[] = [];

      for (const line of lines) {
        const status = line.substring(0, 2);
        const file = line.substring(3);

        if (status[0] && status[0] !== ' ' && status[0] !== '?') {
          staged.push(file);
        }
        if (status[1] === 'M') modified.push(file);
        if (status[1] === 'D') deleted.push(file);
        if (status === '??') untracked.push(file);
      }

      let output = `🌳 Dal: ${branch}\n\n`;

      if (staged.length > 0) {
        output += `✅ Hazırlanmış (${staged.length}):\n${staged.map(f => `  ${f}`).join('\n')}\n\n`;
      }
      if (modified.length > 0) {
        output += `📝 Değiştirilmiş (${modified.length}):\n${modified.map(f => `  ${f}`).join('\n')}\n\n`;
      }
      if (deleted.length > 0) {
        output += `🗑️ Silinmiş (${deleted.length}):\n${deleted.map(f => `  ${f}`).join('\n')}\n\n`;
      }
      if (untracked.length > 0) {
        output += `❓ Takip edilmeyen (${untracked.length}):\n${untracked.map(f => `  ${f}`).join('\n')}\n\n`;
      }

      if (lines.length === 0) {
        output += 'Çalışma alanı temiz — değişiklik yok.';
      }

      return {
        success: true,
        output,
        metadata: { branch, staged, modified, untracked, deleted }
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: `Git status hatası: ${error.message}`
      };
    }
  }
}
