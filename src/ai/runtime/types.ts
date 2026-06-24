export type RuntimeMode = 'local' | 'sandbox' | 'cloud';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';

export interface RuntimeJob {
  id: string;
  type: string;
  payload: Record<string, any>;
  status: JobStatus;
  mode: RuntimeMode;
  priority: number;
  maxRetries: number;
  retries: number;
  timeout: number;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface RuntimeConfig {
  mode: RuntimeMode;
  maxConcurrentJobs: number;
  defaultTimeout: number;
  defaultRetries: number;
  queueSize: number;
}

export interface SchedulerConfig {
  checkInterval: number;
  maxRetries: number;
  retryDelay: number;
  concurrencyLimit: number;
}
