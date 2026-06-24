import { Tool, ToolResult } from './index';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitDiffTool implements Tool {
  name = 'git_diff';
  description = 'Git farkını göster';

  definition = {
    name: 'git_diff',
    description: 'Git diff çıktısını gösterir. Belirli bir dosya veya tüm değişiklikler için kullanılabilir.',
    parameters: {
      filePath: {
        type: 'string' as const,
        description: 'Diff gösterilecek dosya yolu (boşsa tüm değişiklikler)',
      },
      staged: {
        type: 'boolean' as const,
        description: 'Hazırlanmış değişiklikleri göster',
        default: false
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
    const { filePath, staged = false, workingDirectory } = params;

    try {
      let cmd = 'git diff';
      if (staged) cmd = 'git diff --staged';
      if (filePath) cmd += ` -- "${filePath}"`;

      const { stdout } = await execAsync(cmd, {
        cwd: workingDirectory,
        timeout: 15000,
        encoding: 'utf-8',
        maxBuffer: 5 * 1024 * 1024
      });

      if (!stdout.trim()) {
        return {
          success: true,
          output: 'Fark yok — değişiklik bulunmuyor.',
          metadata: { filePath, staged, diffLines: 0 }
        };
      }

      const diffLines = stdout.trim().split('\n').length;

      return {
        success: true,
        output: `📊 Diff (${diffLines} satır):\n\n${stdout}`,
        metadata: { filePath, staged, diffLines }
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: `Git diff hatası: ${error.message}`
      };
    }
  }
}
