import { BaseEntity } from './common';

export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'local' | 'custom';

export interface AIProvider extends BaseEntity {
  name: string;
  type: AIProviderType;
  baseUrl: string;
  apiKey?: string;
  isActive: boolean;
  models: AIModel[];
  rateLimit: RateLimit;
  config: ProviderConfig;
}

export interface RateLimit {
  requestsPerMinute: number;
  tokensPerMinute: number;
  requestsRemaining: number;
  tokensRemaining: number;
  resetAt: string;
}

export interface ProviderConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences: string[];
}

export interface AIModel extends BaseEntity {
  providerId: string;
  name: string;
  displayName: string;
  description: string;
  maxTokens: number;
  contextWindow: number;
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  supportsVision: boolean;
  supportsCodeExecution: boolean;
  capabilities: ModelCapability[];
}

export type ModelCapability =
  | 'chat'
  | 'code'
  | 'completion'
  | 'embedding'
  | 'vision'
  | 'function_calling'
  | 'code_execution';

export interface AIResponse {
  id: string;
  model: string;
  provider: string;
  content: string;
  finishReason: FinishReason;
  tokenUsage: ResponseTokenUsage;
  toolCalls: ToolCall[];
  metadata: ResponseMetadata;
  createdAt: string;
}

export type FinishReason =
  | 'stop'
  | 'length'
  | 'tool_calls'
  | 'content_filter'
  | 'error'
  | 'timeout';

export interface ResponseTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ResponseMetadata {
  latencyMs: number;
  cached: boolean;
  requestId: string;
  model: string;
}

export interface StreamChunk {
  id: string;
  delta: StreamDelta;
  finishReason?: FinishReason;
  index: number;
}

export interface StreamDelta {
  role?: MessageRole;
  content?: string;
  toolCalls?: ToolCallDelta[];
}

export interface ToolCallDelta {
  index: number;
  id?: string;
  type?: 'function';
  function?: {
    name?: string;
    arguments?: string;
  };
}

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ToolCall {
  id: string;
  type: 'function';
  function: FunctionCall;
}

export interface FunctionCall {
  name: string;
  arguments: string;
  parsedArguments?: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  content: string;
  isError: boolean;
  metadata?: Record<string, unknown>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameters;
}

export interface ToolParameters {
  type: 'object';
  properties: Record<string, ToolParameterProperty>;
  required: string[];
}

export interface ToolParameterProperty {
  type: string;
  description: string;
  enum?: string[];
  items?: {
    type: string;
  };
}

export interface AIAgentConfig {
  modelId: string;
  providerId: string;
  temperature: number;
  maxTokens: number;
  tools: ToolDefinition[];
  systemPrompt: string;
  maxIterations: number;
  timeout: number;
}
