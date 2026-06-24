import { RuntimeJob, JobStatus } from './types';
import { nanoid } from 'nanoid';

export class JobQueue {
  private queue: RuntimeJob[] = [];
  private running: Map<string, RuntimeJob> = new Map();
  private completed: RuntimeJob[] = [];
  private maxConcurrent: number;
  private handlers: Map<string, (job: RuntimeJob) => Promise<any>> = new Map();

  constructor(maxConcurrent: number = 5) {
    this.maxConcurrent = maxConcurrent;
  }

  enqueue(type: string, payload: Record<string, any>, options: {
    priority?: number;
    timeout?: number;
    maxRetries?: number;
  } = {}): string {
    const job: RuntimeJob = {
      id: `job_${nanoid(10)}`,
      type,
      payload,
      status: 'queued',
      mode: 'local',
      priority: options.priority || 0,
      maxRetries: options.maxRetries || 3,
      retries: 0,
      timeout: options.timeout || 30000,
      createdAt: new Date()
    };

    this.queue.push(job);
    this.queue.sort((a, b) => b.priority - a.priority);
    this.processNext();
    return job.id;
  }

  registerHandler(type: string, handler: (job: RuntimeJob) => Promise<any>): void {
    this.handlers.set(type, handler);
  }

  getJob(id: string): RuntimeJob | undefined {
    return this.queue.find(j => j.id === id) ||
           this.running.get(id) ||
           this.completed.find(j => j.id === id);
  }

  cancel(id: string): boolean {
    const job = this.getJob(id);
    if (!job) return false;

    if (job.status === 'queued') {
      this.queue = this.queue.filter(j => j.id !== id);
      job.status = 'cancelled';
      this.completed.push(job);
      return true;
    }

    if (job.status === 'running') {
      this.running.delete(id);
      job.status = 'cancelled';
      job.completedAt = new Date();
      this.completed.push(job);
      this.processNext();
      return true;
    }

    return false;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getRunningCount(): number {
    return this.running.size;
  }

  getStats(): { queued: number; running: number; completed: number; failed: number } {
    return {
      queued: this.queue.length,
      running: this.running.size,
      completed: this.completed.filter(j => j.status === 'completed').length,
      failed: this.completed.filter(j => j.status === 'failed').length
    };
  }

  clear(): void {
    this.queue = [];
    this.running.clear();
    this.completed = [];
  }

  private async processNext(): Promise<void> {
    if (this.running.size >= this.maxConcurrent) return;
    if (this.queue.length === 0) return;

    const job = this.queue.shift()!;
    this.running.set(job.id, job);

    const handler = this.handlers.get(job.type);
    if (!handler) {
      job.status = 'failed';
      job.error = `Handler bulunamadi: ${job.type}`;
      job.completedAt = new Date();
      this.running.delete(job.id);
      this.completed.push(job);
      this.processNext();
      return;
    }

    job.status = 'running';
    job.startedAt = new Date();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Zaman asimi')), job.timeout);
    });

    try {
      const result = await Promise.race([handler(job), timeoutPromise]);
      job.status = 'completed';
      job.result = result;
    } catch (error: any) {
      if (job.retries < job.maxRetries) {
        job.retries++;
        job.status = 'queued';
        this.running.delete(job.id);
        this.queue.unshift(job);
        this.processNext();
        return;
      }

      job.status = 'failed';
      job.error = error.message;
    }

    job.completedAt = new Date();
    this.running.delete(job.id);
    this.completed.push(job);

    if (this.completed.length > 1000) {
      this.completed = this.completed.slice(-500);
    }

    this.processNext();
  }
}
