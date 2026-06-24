import { Tool, ToolResult } from './index';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitBranchTool implements Tool {
  name = 'git_branch';
  description = 'Git dal yönetimi';

  definition = {
    name: 'git_branch',
    description: 'Git dal (branch) işlemlerini yönetir: listeleme, oluşturma, silme.',
    parameters: {
      action: {
        type: 'string' as const,
        description: 'Yapılacak işlem: list, create, delete',
        required: true
      },
      name: {
        type: 'string' as const,
        description: 'Dal adı (create/delete için gerekli)',
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
    const { action, name, workingDirectory } = params;

    if (!action) {
      return {
        success: false,
        output: '',
        error: 'İşlem belirtilmedi (list, create, delete)'
      };
    }

    try {
      if (action === 'list') {
        const { stdout } = await execAsync('git branch -a', {
          cwd: workingDirectory,
          timeout: 10000,
          encoding: 'utf-8'
        });

        const branches = stdout.split('\n').filter(Boolean).map(b => b.trim());
        return {
          success: true,
          output: `🌿 Dallar:\n${branches.map(b => `  ${b}`).join('\n')}`,
          metadata: { branches }
        };
      }

      if (action === 'create') {
        if (!name) {
          return { success: false, output: '', error: 'Dal adı belirtilmedi' };
        }
        await execAsync(`git branch "${name}"`, {
          cwd: workingDirectory,
          timeout: 10000,
          encoding: 'utf-8'
        });
        return {
          success: true,
          output: `🌿 "${name}" dalı oluşturuldu`,
          metadata: { branch: name }
        };
      }

      if (action === 'delete') {
        if (!name) {
          return { success: false, output: '', error: 'Silinecek dal adı belirtilmedi' };
        }
        await execAsync(`git branch -d "${name}"`, {
          cwd: workingDirectory,
          timeout: 10000,
          encoding: 'utf-8'
        });
        return {
          success: true,
          output: `🗑️ "${name}" dalı silindi`,
          metadata: { branch: name }
        };
      }

      return {
        success: false,
        output: '',
        error: `Bilinmeyen işlem: ${action}. Kullanılabilir: list, create, delete`
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: `Git branch hatası: ${error.message}`
      };
    }
  }
}
