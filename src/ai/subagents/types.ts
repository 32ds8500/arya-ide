export type SubagentStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface SubagentConfig {
  id: string;
  type: string;
  prompt: string;
  context?: string;
  parentId?: string;
  timeout?: number;
  maxRetries?: number;
  model?: string;
  provider?: string;
  tools?: string[];
}

export interface SubagentResult {
  id: string;
  status: SubagentStatus;
  output: string;
  error?: string;
  duration: number;
  tokensUsed: number;
}

export interface SubagentEvent {
  type: 'started' | 'progress' | 'completed' | 'failed' | 'cancelled';
  subagentId: string;
  data?: any;
  timestamp: Date;
}

export type SubagentEventHandler = (event: SubagentEvent) => void;
