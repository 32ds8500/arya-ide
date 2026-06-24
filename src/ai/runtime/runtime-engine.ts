import { RuntimeMode, RuntimeConfig, RuntimeJob } from './types';
import { JobQueue } from './job-queue';
import { Sandbox } from '../security/sandbox';

const DEFAULT_CONFIG: RuntimeConfig = {
  mode: 'local',
  maxConcurrentJobs: 5,
  defaultTimeout: 30000,
  defaultRetries: 3,
  queueSize: 100
};

export class RuntimeEngine {
  private config: RuntimeConfig;
  private queue: JobQueue;
  private sandbox: Sandbox | null = null;

  constructor(config: Partial<RuntimeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queue = new JobQueue(this.config.maxConcurrentJobs);

    if (this.config.mode === 'sandbox') {
      this.sandbox = new Sandbox();
    }
  }

  async init(): Promise<void> {
    if (this.sandbox) {
      await this.sandbox.init();
    }
  }

  getMode(): RuntimeMode {
    return this.config.mode;
  }

  setMode(mode: RuntimeMode): void {
    this.config.mode = mode;
    if (mode === 'sandbox' && !this.sandbox) {
      this.sandbox = new Sandbox();
    }
  }

  async execute(type: string, payload: Record<string, any>, options: {
    priority?: number;
    timeout?: number;
    maxRetries?: number;
  } = {}): Promise<string> {
    return this.queue.enqueue(type, payload, {
      priority: options.priority,
      timeout: options.timeout || this.config.defaultTimeout,
      maxRetries: options.maxRetries || this.config.defaultRetries
    });
  }

  async executeCommand(command: string, cwd?: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    if (this.config.mode === 'sandbox' && this.sandbox) {
      return this.sandbox.execute(command, cwd);
    }

    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout: this.config.defaultTimeout,
        encoding: 'utf-8'
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

  registerHandler(type: string, handler: (job: RuntimeJob) => Promise<any>): void {
    this.queue.registerHandler(type, handler);
  }

  getJob(id: string) {
    return this.queue.getJob(id);
  }

  cancelJob(id: string): boolean {
    return this.queue.cancel(id);
  }

  getStats() {
    return {
      mode: this.config.mode,
      queue: this.queue.getStats(),
      config: this.config
    };
  }

  async cleanup(): Promise<void> {
    this.queue.clear();
    if (this.sandbox) {
      await this.sandbox.cleanup();
    }
  }
}
