import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';

const execAsync = promisify(exec);

export interface SandboxConfig {
  enabled: boolean;
  timeout: number;
  maxMemory: string;
  networkAccess: boolean;
  filesystemAccess: 'none' | 'read-only' | 'restricted' | 'full';
  allowedPaths: string[];
  blockedCommands: string[];
}

const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
  enabled: true,
  timeout: 30000,
  maxMemory: '256m',
  networkAccess: true,
  filesystemAccess: 'restricted',
  allowedPaths: [],
  blockedCommands: [
    'rm -rf /',
    'mkfs',
    ':(){:|:&};:',
    'dd if=/dev/zero of=/dev/sda',
    'chmod -R 777 /',
    'wget -O- | sh',
    'curl | sh'
  ]
};

export class Sandbox {
  private config: SandboxConfig;
  private sandboxDir: string;

  constructor(config: Partial<SandboxConfig> = {}) {
    this.config = { ...DEFAULT_SANDBOX_CONFIG, ...config };
    this.sandboxDir = join(process.cwd(), '.sandbox', nanoid(8));
  }

  async init(): Promise<void> {
    if (!this.config.enabled) return;
    await mkdir(this.sandboxDir, { recursive: true });
    await mkdir(join(this.sandboxDir, 'workspace'), { recursive: true });
  }

  async execute(command: string, cwd?: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    if (!this.config.enabled) {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout: this.config.timeout,
        encoding: 'utf-8'
      });
      return { stdout, stderr, exitCode: 0 };
    }

    this.validateCommand(command);

    const workDir = cwd || join(this.sandboxDir, 'workspace');

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: workDir,
        timeout: this.config.timeout,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024
      });
      return { stdout, stderr, exitCode: 0 };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1
      };
    }
  }

  async readFileInSandbox(filePath: string): Promise<string> {
    if (this.config.filesystemAccess === 'none') {
      throw new Error('Dosya erisimi engellendi (sandbox)');
    }

    if (this.config.filesystemAccess === 'restricted') {
      const isAllowed = this.isPathAllowed(filePath);
      if (!isAllowed) {
        throw new Error(`Yol izin verilmeyen: ${filePath}`);
      }
    }

    return readFile(filePath, 'utf-8');
  }

  async writeFileInSandbox(filePath: string, content: string): Promise<void> {
    if (this.config.filesystemAccess === 'none' || this.config.filesystemAccess === 'read-only') {
      throw new Error('Dosya yazma engellendi (sandbox)');
    }

    if (this.config.filesystemAccess === 'restricted') {
      const isAllowed = this.isPathAllowed(filePath);
      if (!isAllowed) {
        throw new Error(`Yol izin verilmeyen: ${filePath}`);
      }
    }

    await writeFile(filePath, content, 'utf-8');
  }

  private validateCommand(command: string): void {
    for (const blocked of this.config.blockedCommands) {
      if (command.includes(blocked)) {
        throw new Error(`Engellenen komut: ${blocked}`);
      }
    }

    if (!this.config.networkAccess) {
      const networkCommands = ['curl', 'wget', 'fetch', 'http', 'ping', 'nc', 'netcat'];
      const cmdParts = command.split(/\s+/);
      if (networkCommands.some(nc => cmdParts.includes(nc))) {
        throw new Error('Ag erisimi engellendi (sandbox)');
      }
    }
  }

  private isPathAllowed(filePath: string): boolean {
    if (this.config.allowedPaths.length === 0) return true;
    return this.config.allowedPaths.some(allowed => filePath.startsWith(allowed));
  }

  getConfig(): SandboxConfig {
    return { ...this.config };
  }

  async cleanup(): Promise<void> {
    try {
      const { rm } = await import('fs/promises');
      await rm(this.sandboxDir, { recursive: true, force: true });
    } catch {
      // temizleme hatası
    }
  }
}

let defaultSandbox: Sandbox | null = null;

export function getSandbox(config?: Partial<SandboxConfig>): Sandbox {
  if (!defaultSandbox) {
    defaultSandbox = new Sandbox(config);
  }
  return defaultSandbox;
}
