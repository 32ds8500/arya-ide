import { Tool, ToolResult } from './index';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitCheckoutTool implements Tool {
  name = 'git_checkout';
  description = 'Git dal veya dosya değiştir';

  definition = {
    name: 'git_checkout',
    description: 'Git ile dal değiştirir veya belirli bir dosyayı belirli bir sürüme geri alır.',
    parameters: {
      branch: {
        type: 'string' as const,
        description: 'Geçilecek dal adı',
      },
      file: {
        type: 'string' as const,
        description: 'Geri alınacak dosya yolu',
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
    const { branch, file, workingDirectory } = params;

    if (!branch && !file) {
      return {
        success: false,
        output: '',
        error: 'Dal adı veya dosya yolu belirtilmedi'
      };
    }

    try {
      if (file) {
        await execAsync(`git checkout -- "${file}"`, {
          cwd: workingDirectory,
          timeout: 10000,
          encoding: 'utf-8'
        });
        return {
          success: true,
          output: `✅ "${file}" dosyası geri alındı`,
          metadata: { file }
        };
      }

      if (branch) {
        await execAsync(`git checkout "${branch}"`, {
          cwd: workingDirectory,
          timeout: 10000,
          encoding: 'utf-8'
        });
        return {
          success: true,
          output: `✅ "${branch}" dalına geçildi`,
          metadata: { branch }
        };
      }

      return { success: false, output: '', error: 'İşlem tanımlanamadı' };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: `Git checkout hatası: ${error.message}`
      };
    }
  }
}
