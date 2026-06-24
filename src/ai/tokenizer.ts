export interface TokenCount {
  tokens: number;
  characters: number;
  words: number;
  lines: number;
}

export interface CostEstimate {
  promptCost: number;
  completionCost: number;
  totalCost: number;
  currency: string;
}

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'gemini-pro': { input: 0.00025, output: 0.0005 },
  'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
  'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
  'gemini-2.0-flash': { input: 0.0001, output: 0.0004 },
  'llama-3.1-70b-versatile': { input: 0.00059, output: 0.00079 },
  'llama-3.1-8b-instant': { input: 0.00005, output: 0.00008 },
  'mixtral-8x7b-32768': { input: 0.00024, output: 0.00024 },
  'deepseek-chat': { input: 0.00014, output: 0.00028 },
  'deepseek-coder': { input: 0.00014, output: 0.00028 }
};

const PROVIDER_MULTIPLIERS: Record<string, number> = {
  'openrouter': 1.1,
  'groq': 1.0,
  'gemini': 1.0,
  'github-models': 1.0,
  'huggingface': 1.0,
  'cloudflare': 0.0,
  'ollama': 0.0,
  'lmstudio': 0.0
};

export function countTokens(text: string, model?: string): TokenCount {
  const characters = text.length;
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  const lines = text.split('\n').length;

  let tokens: number;

  if (model?.includes('gpt') || model?.includes('o1')) {
    tokens = estimateGPTTokens(text);
  } else if (model?.includes('claude')) {
    tokens = estimateClaudeTokens(text);
  } else if (model?.includes('gemini')) {
    tokens = estimateGeminiTokens(text);
  } else {
    tokens = estimateGenericTokens(text);
  }

  return { tokens, characters, words, lines };
}

function estimateGPTTokens(text: string): number {
  let count = 0;
  let i = 0;

  while (i < text.length) {
    const char = text.charCodeAt(i);
    
    if (char < 128) {
      if (char === 32) {
        count++;
        i++;
      } else if (char >= 48 && char <= 57) {
        count++;
        i++;
      } else if (char >= 65 && char <= 90) {
        count++;
        i++;
      } else if (char >= 97 && char <= 122) {
        count++;
        i++;
      } else {
        count++;
        i++;
      }
    } else if (char >= 128 && char < 2048) {
      count++;
      i++;
    } else if (char >= 2048 && char < 65536) {
      count += 2;
      i++;
    } else {
      count += 4;
      i += 2;
    }
  }

  return Math.ceil(count * 0.75);
}

function estimateClaudeTokens(text: string): number {
  const words = text.split(/\s+/).length;
  const chars = text.length;
  return Math.ceil((words * 1.3) + (chars * 0.1));
}

function estimateGeminiTokens(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.ceil(words * 1.2);
}

function estimateGenericTokens(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.ceil(words * 1.3);
}

export function estimateCost(
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number
): CostEstimate {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-3.5-turbo'];
  const multiplier = PROVIDER_MULTIPLIERS[provider] || 1.0;

  const promptCost = (promptTokens / 1000) * pricing.input * multiplier;
  const completionCost = (completionTokens / 1000) * pricing.output * multiplier;
  const totalCost = promptCost + completionCost;

  return {
    promptCost: Math.round(promptCost * 1000000) / 1000000,
    completionCost: Math.round(completionCost * 1000000) / 1000000,
    totalCost: Math.round(totalCost * 1000000) / 1000000,
    currency: 'USD'
  };
}

export function formatCost(cost: CostEstimate): string {
  if (cost.totalCost === 0) return 'Ücretsiz';
  
  if (cost.totalCost < 0.01) {
    return `<$0.01`;
  }
  
  return `$${cost.totalCost.toFixed(4)}`;
}

export function getContextWindow(model: string): number {
  const contextWindows: Record<string, number> = {
    'gpt-4o': 128000,
    'gpt-4o-mini': 128000,
    'gpt-4-turbo': 128000,
    'gpt-4': 8192,
    'gpt-3.5-turbo': 16385,
    'claude-3-opus': 200000,
    'claude-3-sonnet': 200000,
    'claude-3-haiku': 200000,
    'gemini-pro': 32760,
    'gemini-1.5-pro': 1048576,
    'gemini-1.5-flash': 1048576,
    'gemini-2.0-flash': 1048576,
    'llama-3.1-70b-versatile': 128000,
    'llama-3.1-8b-instant': 128000,
    'mixtral-8x7b-32768': 32768,
    'deepseek-chat': 16384,
    'deepseek-coder': 16384
  };

  return contextWindows[model] || 4096;
}

export function truncateToContextWindow(
  messages: Array<{ role: string; content: string }>,
  model: string,
  reservedTokens: number = 1000
): Array<{ role: string; content: string }> {
  const contextWindow = getContextWindow(model);
  const availableTokens = contextWindow - reservedTokens;

  let totalTokens = 0;
  const truncated: Array<{ role: string; content: string }> = [];

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const tokens = countTokens(msg.content, model).tokens;

    if (totalTokens + tokens > availableTokens) {
      break;
    }

    totalTokens += tokens;
    truncated.unshift(msg);
  }

  return truncated;
}
