import { Tool, ToolResult } from './index';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitMergeTool implements Tool {
  name = 'git_merge';
  description = 'Git dal birleştir';

  definition = {
    name: 'git_merge',
    description: 'Belirtilen dalı mevcut dala birleştirir (merge).',
    parameters: {
      branch: {
        type: 'string' as const,
        description: 'Birleştirilecek dal adı',
        required: true
      },
      message: {
        type: 'string' as const,
        description: 'Merge commit mesajı',
      },
      workingDirectory: {
        type: 'string' as const,
        description: 'Çalışma dizini',
      }
    },
    execute: async (params: Record<string, any>): Promise<ToolResult> => {
      return this.execute(params);
    }
  };

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { branch, message, workingDirectory } = params;

    if (!branch) {
      return {
        success: false,
        output: '',
        error: 'Birleştirilecek dal belirtilmedi'
      };
    }

    try {
      let cmd = `git merge "${branch}"`;
      if (message) {
        cmd += ` -m "${message.replace(/"/g, '\\"')}"`;
      }

      const { stdout } = await execAsync(cmd, {
        cwd: workingDirectory,
        timeout: 30000,
        encoding: 'utf-8'
      });

      return {
        success: true,
        output: `✅ Merge başarılı:\n${stdout}`,
        metadata: { branch, message }
      };
    } catch (error: any) {
      return {
        success: false,
        output: error.stdout || '',
        error: `Git merge hatası: ${error.message}`
      };
    }
  }
}
