export interface Message {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  model?: string;
}

export interface StreamOptions extends ChatOptions {
  onToken?: (token: string) => void;
  onDone?: (fullText: string, usage: TokenUsage) => void;
  onError?: (error: Error) => void;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatResponse {
  content: string;
  usage: TokenUsage;
  model: string;
  finishReason: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  contextLength: number;
  maxOutput: number;
  pricing: {
    input: number;
    output: number;
  };
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  organization?: string;
  project?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface AIProvider {
  name: string;
  displayName: string;
  description: string;
  isAvailable(): Promise<boolean>;
  chat(messages: Message[], model?: string, options?: ChatOptions): Promise<ChatResponse>;
  streamChat(messages: Message[], model?: string, options?: StreamOptions): Promise<void>;
  listModels(): Promise<ModelInfo[]>;
  getModelInfo(modelId: string): Promise<ModelInfo | null>;
}
