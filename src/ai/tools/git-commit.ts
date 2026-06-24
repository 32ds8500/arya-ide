import { Tool, ToolResult } from './index';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitCommitTool implements Tool {
  name = 'git_commit';
  description = 'Git commit oluştur';

  definition = {
    name: 'git_commit',
    description: 'Değişiklikleri Git deposuna commit eder. Önce touslanmamış dosyaları staged yapar, sonra commit atar.',
    parameters: {
      message: {
        type: 'string' as const,
        description: 'Commit mesajı',
        required: true
      },
      files: {
        type: 'array' as const,
        description: 'Commit edilecek dosya yolları (boşsa tüm değişiklikler)',
        items: { type: 'string' }
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
    const { message, files, workingDirectory } = params;

    if (!message) {
      return {
        success: false,
        output: '',
        error: 'Commit mesajı belirtilmedi'
      };
    }

    try {
      if (files && files.length > 0) {
        for (const file of files) {
          await execAsync(`git add "${file}"`, {
            cwd: workingDirectory,
            timeout: 10000,
            encoding: 'utf-8'
          });
        }
      } else {
        await execAsync('git add -A', {
          cwd: workingDirectory,
          timeout: 10000,
          encoding: 'utf-8'
        });
      }

      const { stdout } = await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
        cwd: workingDirectory,
        timeout: 15000,
        encoding: 'utf-8'
      });

      const { stdout: hashOut } = await execAsync('git rev-parse --short HEAD', {
        cwd: workingDirectory,
        timeout: 5000,
        encoding: 'utf-8'
      });

      const hash = hashOut.trim();

      return {
        success: true,
        output: `✅ Commit başarılı: ${hash}\n${stdout}`,
        metadata: { hash, message, files: files || ['all'] }
      };
    } catch (error: any) {
      if (error.stdout && error.stdout.includes('nothing to commit')) {
        return {
          success: false,
          output: '',
          error: 'Commit edilecek değişiklik yok'
        };
      }
      return {
        success: false,
        output: '',
        error: `Git commit hatası: ${error.message}`
      };
    }
  }
}
