import { Tool, ToolResult } from './index';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TerminalCommandTool implements Tool {
  name = 'terminal_command';
  description = 'Terminal komutu çalıştır';

  definition = {
    name: 'terminal_command',
    description: 'Sistemde terminal komutu çalıştırır. Çalışma dizini, zaman aşımı ve çıkış boyutu kontrolü sunar.',
    parameters: {
      command: {
        type: 'string' as const,
        description: 'Çalıştırılacak komut',
        required: true
      },
      cwd: {
        type: 'string' as const,
        description: 'Çalışma dizini',
      },
      timeout: {
        type: 'number' as const,
        description: 'Zaman aşımı (milisaniye)',
        default: 30000
      },
      maxOutputSize: {
        type: 'number' as const,
        description: 'Maksimum çıktı boyutu (byte)',
        default: 100000
      }
    },
    execute: async (params: Record<string, any>): Promise<ToolResult> => {
      return this.execute(params);
    }
  };

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { command, cwd, timeout = 30000, maxOutputSize = 100000 } = params;

    if (!command) {
      return {
        success: false,
        output: '',
        error: 'Komut belirtilmedi'
      };
    }

    const blockedCommands = ['rm -rf /', 'mkfs', ':(){:|:&};:', 'dd if=/dev/zero of=/dev/sda'];
    if (blockedCommands.some(blocked => command.includes(blocked))) {
      return {
        success: false,
        output: '',
        error: 'Bu komut güvenlik nedeniyle engellendi'
      };
    }

    try {
      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout,
        maxBuffer: maxOutputSize,
        encoding: 'utf-8'
      });
      const duration = Date.now() - startTime;

      let output = stdout || '';
      if (stderr) {
        output += output ? `\n\n⚠️ Hatalar:\n${  stderr}` : stderr;
      }

      if (output.length > maxOutputSize) {
        output = `${output.slice(0, maxOutputSize)  }\n\n... (çıkış kısaltıldı)`;
      }

      return {
        success: true,
        output: `💻 Komut: ${command}\n⏱️ Süre: ${duration}ms\n\n${output || '(çıktı yok)'}`,
        metadata: {
          command,
          cwd,
          duration,
          stdoutLength: stdout?.length || 0,
          stderrLength: stderr?.length || 0,
          exitCode: 0
        }
      };
    } catch (error: any) {
      const duration = Date.now() - (error.startTime || Date.now());
      
      let output = error.stdout || '';
      if (error.stderr) {
        output += output ? `\n\n❌ Hatalar:\n${  error.stderr}` : error.stderr;
      }

      return {
        success: false,
        output: output ? `💻 Komut: ${command}\n⏱️ Süre: ${duration}ms\n\n${output}` : '',
        error: `Komut hatası (çıkış kodu: ${error.code || 'bilinmiyor'}): ${error.message}`,
        metadata: {
          command,
          cwd,
          duration,
          exitCode: error.code,
          stdoutLength: error.stdout?.length || 0,
          stderrLength: error.stderr?.length || 0
        }
      };
    }
  }
}
