import { Message, ChatResponse } from './providers/base';
import { createProvider, getAvailableProviders, ProviderName } from './providers';
import { getToolDefinitions } from './tools';
import { estimateCost } from './tokenizer';

export interface ChatSession {
  id: string;
  messages: Message[];
  provider: ProviderName;
  model: string;
  totalTokens: number;
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatResult {
  response: ChatResponse;
  session: ChatSession;
}

const sessions = new Map<string, ChatSession>();

export function createSession(provider: ProviderName, model: string): ChatSession {
  const id = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const session: ChatSession = {
    id,
    messages: [],
    provider,
    model,
    totalTokens: 0,
    totalCost: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  sessions.set(id, session);
  return session;
}

export function getSession(id: string): ChatSession | undefined {
  return sessions.get(id);
}

export function deleteSession(id: string): boolean {
  return sessions.delete(id);
}

export async function chat(
  messages: Message[],
  options: {
    provider?: ProviderName;
    model?: string;
    systemPrompt?: string;
    tools?: boolean;
    temperature?: number;
    maxTokens?: number;
    sessionId?: string;
  } = {}
): Promise<ChatResult> {
  const {
    provider: requestedProvider,
    model: requestedModel,
    systemPrompt,
    tools = false,
    temperature = 0.7,
    maxTokens = 4096,
    sessionId
  } = options;

  let provider: ProviderName;
  if (requestedProvider) {
    provider = requestedProvider;
  } else {
    const available = await getAvailableProviders();
    if (available.length === 0) {
      throw new Error('Kullanılabilir AI sağlayıcısı bulunamadı');
    }
    provider = available[0];
  }

  const aiProvider = createProvider(provider);

  const model = requestedModel || getDefaultModel(provider);

  const allMessages: Message[] = [];

  if (systemPrompt) {
    allMessages.push({ role: 'system', content: systemPrompt });
  }

  if (tools) {
    const toolDefs = getToolDefinitions();
    const toolContext = `\n\nKullanılabilir araçlar:\n${toolDefs.map(t => `- ${t.name}: ${t.description}`).join('\n')}`;
    if (allMessages[0]) {
      allMessages[0].content += toolContext;
    }
  }

  allMessages.push(...messages);

  const startTime = Date.now();

  const response = await aiProvider.chat(allMessages, model, {
    temperature,
    maxTokens
  });

  const cost = estimateCost(provider, model, response.usage.promptTokens, response.usage.completionTokens);

  const session = sessionId ? sessions.get(sessionId) : undefined;
  if (session) {
    session.messages.push(...messages);
    session.messages.push({ role: 'assistant', content: response.content });
    session.totalTokens += response.usage.totalTokens;
    session.totalCost += cost.totalCost;
    session.updatedAt = new Date();
  }

  return {
    response: {
      ...response,
      usage: {
        ...response.usage,
        totalTokens: response.usage.totalTokens
      }
    },
    session: session || createSession(provider, model)
  };
}

export async function streamChat(
  messages: Message[],
  options: {
    provider?: ProviderName;
    model?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    onToken?: (token: string) => void;
    onDone?: (fullText: string, usage: any) => void;
    onError?: (error: Error) => void;
    sessionId?: string;
  } = {}
): Promise<void> {
  const {
    provider: requestedProvider,
    model: requestedModel,
    systemPrompt,
    temperature = 0.7,
    maxTokens = 4096,
    onToken,
    onDone,
    onError,
    sessionId
  } = options;

  let provider: ProviderName;
  if (requestedProvider) {
    provider = requestedProvider;
  } else {
    const available = await getAvailableProviders();
    if (available.length === 0) {
      throw new Error('Kullanılabilir AI sağlayıcısı bulunamadı');
    }
    provider = available[0];
  }

  const aiProvider = createProvider(provider);
  const model = requestedModel || getDefaultModel(provider);

  const allMessages: Message[] = [];
  if (systemPrompt) {
    allMessages.push({ role: 'system', content: systemPrompt });
  }
  allMessages.push(...messages);

  await aiProvider.streamChat(allMessages, model, {
    temperature,
    maxTokens,
    onToken,
    onDone: (fullText, usage) => {
      const session = sessionId ? sessions.get(sessionId) : undefined;
      if (session) {
        session.messages.push(...messages);
        session.messages.push({ role: 'assistant', content: fullText });
        session.totalTokens += usage.totalTokens;
        session.totalCost += estimateCost(provider, model, usage.promptTokens, usage.completionTokens).totalCost;
        session.updatedAt = new Date();
      }
      onDone?.(fullText, usage);
    },
    onError
  });
}

function getDefaultModel(provider: ProviderName): string {
  const defaults: Record<ProviderName, string> = {
    'ollama': 'llama3.2',
    'lmstudio': 'default',
    'free-models': 'llama3.2',
    'colab': 'qwen2.5-coder:7b',
    'openrouter': 'openai/gpt-4o',
    'groq': 'llama-3.1-8b-instant',
    'gemini': 'gemini-2.0-flash',
    'github-models': 'gpt-4o',
    'huggingface': 'meta-llama/Llama-3.1-8B-Instruct',
    'cloudflare': '@cf/meta/llama-3.1-8b-instruct'
  };
  return defaults[provider];
}

export function getSessionStats(sessionId: string): {
  messages: number;
  tokens: number;
  cost: number;
  duration: number;
} | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  return {
    messages: session.messages.length,
    tokens: session.totalTokens,
    cost: session.totalCost,
    duration: session.updatedAt.getTime() - session.createdAt.getTime()
  };
}

export function listSessions(): ChatSession[] {
  return Array.from(sessions.values());
}
