export interface ContextWindow {
  messages: ContextMessage[];
  totalTokens: number;
  maxTokens: number;
}

export interface ContextMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  tokens: number;
  priority: number;
  timestamp: Date;
}

export interface CompressedContext {
  summary: string;
  keyPoints: string[];
  tokenCount: number;
}

export interface ContextConfig {
  maxTokens: number;
  compressionThreshold: number;
  priorityWeight: number;
  recencyWeight: number;
  importanceWeight: number;
}
