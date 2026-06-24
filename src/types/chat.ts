import { BaseEntity } from './common';
import { ToolCall, ToolResult } from './ai';

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export type MessageStatus = 'pending' | 'streaming' | 'completed' | 'error' | 'cancelled';

export interface Chat extends BaseEntity {
  title: string;
  projectId?: string;
  userId: string;
  modelId: string;
  providerId: string;
  systemPrompt?: string;
  messageCount: number;
  lastMessageAt?: string;
  isPinned: boolean;
  tags: string[];
}

export interface Message extends BaseEntity {
  chatId: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  parentId?: string;
  modelId?: string;
  tokenUsage: TokenUsage;
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  metadata: MessageMetadata;
  isEdited: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

export interface MessageMetadata {
  model: string;
  provider: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  latencyMs: number;
  cached: boolean;
}

export interface CreateChatInput {
  title?: string;
  projectId?: string;
  modelId: string;
  providerId: string;
  systemPrompt?: string;
}

export interface SendMessageInput {
  chatId: string;
  content: string;
  role?: MessageRole;
  parentId?: string;
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: (message: Message) => void;
  onError: (error: Error) => void;
}

export interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  isStreaming: boolean;
  streamingMessageId: string | null;
  error: string | null;
}
