import { Tool, ToolResult } from './index';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class KillProcessTool implements Tool {
  name = 'kill_process';
  description = 'Süreci öldür';

  definition = {
    name: 'kill_process',
    description: 'Belirtilen PID veya isimle bir süreci sonlandırır.',
    parameters: {
      pid: {
        type: 'number' as const,
        description: 'Süreci PID numarası',
      },
      name: {
        type: 'string' as const,
        description: 'Süreci adı (PID yerine)',
      },
      signal: {
        type: 'string' as const,
        description: 'Gönderilecek sinyal',
        default: 'SIGTERM'
      }
    },
    execute: async (params: Record<string, any>): Promise<ToolResult> => {
      return this.execute(params);
    }
  };

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { pid, name, signal = 'SIGTERM' } = params;

    if (!pid && !name) {
      return {
        success: false,
        output: '',
        error: 'PID veya süreç adı belirtilmedi'
      };
    }

    try {
      if (pid) {
        await execAsync(`kill -${signal} ${pid}`, {
          timeout: 5000,
          encoding: 'utf-8'
        });
        return {
          success: true,
          output: `✅ Süreç ${pid} (${signal}) ile sonlandırıldı`,
          metadata: { pid, signal }
        };
      }

      if (name) {
        await execAsync(`pkill -${signal} -f "${name}"`, {
          timeout: 5000,
          encoding: 'utf-8'
        });
        return {
          success: true,
          output: `✅ "${name}" süreçleri (${signal}) ile sonlandırıldı`,
          metadata: { name, signal }
        };
      }

      return { success: false, output: '', error: 'İşlem tanımlanamadı' };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: `Süreç sonlandırma hatası: ${error.message}`
      };
    }
  }
}
