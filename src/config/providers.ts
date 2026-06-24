export interface ProviderConfig {
  name: string;
  slug: string;
  baseUrl: string;
  apiKeyRequired: boolean;
  models: ModelInfo[];
  capabilities: string[];
}

export interface ModelInfo {
  modelId: string;
  name: string;
  description: string;
  maxTokens: number;
  inputPrice: number;
  outputPrice: number;
  isFree: boolean;
  capabilities: {
    chat: boolean;
    completion: boolean;
    embeddings?: boolean;
    vision?: boolean;
  };
}

export const providerConfigs: ProviderConfig[] = [
  {
    name: 'Ollama',
    slug: 'ollama',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    apiKeyRequired: false,
    capabilities: ['chat', 'completion', 'embeddings'],
    models: [
      { modelId: 'llama3.1:8b', name: 'Llama 3.1 8B', description: 'Fast and efficient general model', maxTokens: 8192, inputPrice: 0, outputPrice: 0, isFree: true, capabilities: { chat: true, completion: true, embeddings: false } },
      { modelId: 'llama3.1:70b', name: 'Llama 3.1 70B', description: 'High quality general model', maxTokens: 8192, inputPrice: 0, outputPrice: 0, isFree: true, capabilities: { chat: true, completion: true, embeddings: false } },
      { modelId: 'codellama:34b', name: 'Code Llama 34B', description: 'Code-specialized model', maxTokens: 16384, inputPrice: 0, outputPrice: 0, isFree: true, capabilities: { chat: true, completion: true, embeddings: false } },
      { modelId: 'qwen2.5-coder:32b', name: 'Qwen 2.5 Coder 32B', description: 'Excellent for coding tasks', maxTokens: 32768, inputPrice: 0, outputPrice: 0, isFree: true, capabilities: { chat: true, completion: true, embeddings: false } },
      { modelId: 'deepseek-coder-v2:16b', name: 'DeepSeek Coder V2 16B', description: 'Strong coding performance', maxTokens: 16384, inputPrice: 0, outputPrice: 0, isFree: true, capabilities: { chat: true, completion: true, embeddings: false } },
    ],
  },
  {
    name: 'LM Studio',
    slug: 'lmstudio',
    baseUrl: process.env.LM_STUDIO_BASE_URL || 'http://localhost:1234',
    apiKeyRequired: false,
    capabilities: ['chat', 'completion', 'embeddings'],
    models: [
      { modelId: 'local-model', name: 'Local Model', description: 'Model loaded in LM Studio', maxTokens: 4096, inputPrice: 0, outputPrice: 0, isFree: true, capabilities: { chat: true, completion: true, embeddings: false } },
    ],
  },
  {
    name: 'OpenRouter',
    slug: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyRequired: true,
    capabilities: ['chat', 'completion'],
    models: [
      { modelId: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', description: 'Anthropic Claude Sonnet 4', maxTokens: 8192, inputPrice: 0.003, outputPrice: 0.015, isFree: false, capabilities: { chat: true, completion: true, vision: true } },
      { modelId: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', description: 'Fast and affordable', maxTokens: 8192, inputPrice: 0.001, outputPrice: 0.005, isFree: false, capabilities: { chat: true, completion: true, vision: true } },
      { modelId: 'openai/gpt-4o', name: 'GPT-4o', description: 'OpenAI flagship model', maxTokens: 128000, inputPrice: 0.0025, outputPrice: 0.01, isFree: false, capabilities: { chat: true, completion: true, vision: true } },
      { modelId: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and affordable OpenAI model', maxTokens: 128000, inputPrice: 0.00015, outputPrice: 0.0006, isFree: false, capabilities: { chat: true, completion: true, vision: true } },
      { modelId: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Google Gemini 2.5 Pro', maxTokens: 1048576, inputPrice: 0.00125, outputPrice: 0.01, isFree: false, capabilities: { chat: true, completion: true, vision: true } },
      { modelId: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast and affordable Gemini', maxTokens: 1048576, inputPrice: 0.00015, outputPrice: 0.0006, isFree: false, capabilities: { chat: true, completion: true, vision: true } },
      { modelId: 'deepseek/deepseek-chat', name: 'DeepSeek V3', description: 'DeepSeek V3 chat model', maxTokens: 65536, inputPrice: 0.00027, outputPrice: 0.0011, isFree: false, capabilities: { chat: true, completion: true } },
      { modelId: 'deepseek/deepseek-r1', name: 'DeepSeek R1', description: 'DeepSeek reasoning model', maxTokens: 65536, inputPrice: 0.00055, outputPrice: 0.00219, isFree: false, capabilities: { chat: true, completion: true } },
    ],
  },
  {
    name: 'Groq',
    slug: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKeyRequired: true,
    capabilities: ['chat', 'completion'],
    models: [
      { modelId: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'High quality, fast inference', maxTokens: 8192, inputPrice: 0.00059, outputPrice: 0.00079, isFree: false, capabilities: { chat: true, completion: true } },
      { modelId: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', description: 'Ultra-fast inference', maxTokens: 8192, inputPrice: 0.0001, outputPrice: 0.0001, isFree: false, capabilities: { chat: true, completion: true } },
      { modelId: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'Mixture of experts model', maxTokens: 32768, inputPrice: 0.00024, outputPrice: 0.00024, isFree: false, capabilities: { chat: true, completion: true } },
      { modelId: 'gemma2-9b-it', name: 'Gemma 2 9B', description: 'Google Gemma 2 9B', maxTokens: 8192, inputPrice: 0.0002, outputPrice: 0.0002, isFree: false, capabilities: { chat: true, completion: true } },
    ],
  },
  {
    name: 'Gemini',
    slug: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyRequired: true,
    capabilities: ['chat', 'completion', 'embeddings', 'vision'],
    models: [
      { modelId: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Most capable Gemini model', maxTokens: 1048576, inputPrice: 0.00125, outputPrice: 0.01, isFree: false, capabilities: { chat: true, completion: true, vision: true } },
      { modelId: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast and affordable', maxTokens: 1048576, inputPrice: 0.00015, outputPrice: 0.0006, isFree: false, capabilities: { chat: true, completion: true, vision: true } },
      { modelId: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Latest flash model', maxTokens: 1048576, inputPrice: 0.0001, outputPrice: 0.0004, isFree: false, capabilities: { chat: true, completion: true, vision: true } },
    ],
  },
  {
    name: 'GitHub Models',
    slug: 'github-models',
    baseUrl: 'https://models.inference.ai.azure.com',
    apiKeyRequired: true,
    capabilities: ['chat', 'completion'],
    models: [
      { modelId: 'gpt-4o', name: 'GPT-4o', description: 'OpenAI GPT-4o via GitHub', maxTokens: 128000, inputPrice: 0.0025, outputPrice: 0.01, isFree: false, capabilities: { chat: true, completion: true, vision: true } },
      { modelId: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Affordable GPT-4o via GitHub', maxTokens: 128000, inputPrice: 0.00015, outputPrice: 0.0006, isFree: false, capabilities: { chat: true, completion: true, vision: true } },
      { modelId: 'Phi-4', name: 'Phi-4', description: 'Microsoft Phi-4', maxTokens: 16384, inputPrice: 0, outputPrice: 0, isFree: true, capabilities: { chat: true, completion: true } },
      { modelId: 'DeepSeek-R1', name: 'DeepSeek R1', description: 'DeepSeek reasoning model via GitHub', maxTokens: 65536, inputPrice: 0.00055, outputPrice: 0.00219, isFree: false, capabilities: { chat: true, completion: true } },
    ],
  },
  {
    name: 'HuggingFace',
    slug: 'huggingface',
    baseUrl: 'https://api-inference.huggingface.co/v1',
    apiKeyRequired: true,
    capabilities: ['chat', 'completion', 'embeddings'],
    models: [
      { modelId: 'meta-llama/Meta-Llama-3.1-70B-Instruct', name: 'Llama 3.1 70B', description: 'HuggingFace Inference API', maxTokens: 8192, inputPrice: 0.00035, outputPrice: 0.0004, isFree: false, capabilities: { chat: true, completion: true } },
      { modelId: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B', description: 'Mistral 7B Instruct', maxTokens: 8192, inputPrice: 0.0001, outputPrice: 0.0001, isFree: false, capabilities: { chat: true, completion: true } },
    ],
  },
  {
    name: 'Cloudflare AI',
    slug: 'cloudflare-ai',
    baseUrl: 'https://api.cloudflare.com/client/v4/accounts',
    apiKeyRequired: true,
    capabilities: ['chat', 'completion', 'embeddings'],
    models: [
      { modelId: '@cf/meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', description: 'Cloudflare Workers AI', maxTokens: 8192, inputPrice: 0, outputPrice: 0, isFree: true, capabilities: { chat: true, completion: true } },
      { modelId: '@cf/meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', description: 'Cloudflare Workers AI', maxTokens: 8192, inputPrice: 0.000415, outputPrice: 0.000415, isFree: false, capabilities: { chat: true, completion: true } },
      { modelId: '@cf/mistral/mistral-7b-instruct-v0.2', name: 'Mistral 7B', description: 'Cloudflare Workers AI', maxTokens: 8192, inputPrice: 0.00011, outputPrice: 0.00011, isFree: false, capabilities: { chat: true, completion: true } },
    ],
  },
];

export function getProviderBySlug(slug: string): ProviderConfig | undefined {
  return providerConfigs.find((p) => p.slug === slug);
}

export function getModelById(modelId: string): { provider: ProviderConfig; model: ModelInfo } | undefined {
  for (const provider of providerConfigs) {
    const model = provider.models.find((m) => m.modelId === modelId);
    if (model) return { provider, model };
  }
  return undefined;
}
