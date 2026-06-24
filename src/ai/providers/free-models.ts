import { AIProvider, Message, ChatOptions, StreamOptions, ChatResponse, TokenUsage, ModelInfo, ProviderConfig } from './base';

interface FreeModel {
  id: string;
  name: string;
  provider: 'ollama' | 'lmstudio' | 'openrouter' | 'groq' | 'gemini' | 'cloudflare' | 'huggingface';
  baseUrl: string;
  requiresApiKey: boolean;
  contextLength: number;
  maxOutput: number;
  description: string;
}

const OLLAMA_BASE = typeof process !== 'undefined' && process.env?.OLLAMA_BASE_URL
  ? process.env.OLLAMA_BASE_URL
  : 'http://localhost:11434';

const LM_STUDIO_BASE = typeof process !== 'undefined' && process.env?.LM_STUDIO_BASE_URL
  ? process.env.LM_STUDIO_BASE_URL
  : 'http://localhost:1234';

function ollamaModel(id: string, name: string, context: number, output: number, desc: string): FreeModel {
  return { id, name, provider: 'ollama', baseUrl: OLLAMA_BASE, requiresApiKey: false, contextLength: context, maxOutput: output, description: desc };
}

function lmStudioModel(id: string, name: string, context: number, output: number, desc: string): FreeModel {
  return { id, name, provider: 'lmstudio', baseUrl: LM_STUDIO_BASE, requiresApiKey: false, contextLength: context, maxOutput: output, description: desc };
}

const FREE_MODELS: FreeModel[] = [
  ollamaModel('llama3.2', 'Llama 3.2 3B', 128000, 4096, 'Hafif ve hizli, gunluk kullanim'),
  ollamaModel('llama3.2:latest', 'Llama 3.2', 128000, 4096, 'Guncel surum'),
  ollamaModel('mistral:latest', 'Mistral 7B', 32768, 4096, 'Dengeli performans'),
  ollamaModel('codellama:latest', 'Code Llama', 16384, 4096, 'Kod yazma icin optimize'),
  ollamaModel('deepseek-coder:latest', 'DeepSeek Coder', 16384, 4096, 'Profesyonel kod yazma'),
  ollamaModel('qwen2.5-coder:latest', 'Qwen 2.5 Coder', 32768, 8192, 'Cok dilli kod yazma'),
  ollamaModel('phi3:latest', 'Phi-3 Mini', 128000, 4096, 'Microsoft kucuk model'),
  ollamaModel('gemma2:latest', 'Gemma 2', 8192, 4096, 'Google modeli'),
  ollamaModel('nomic-embed-text', 'Nomic Embed', 8192, 0, 'Vektor gomme icin'),
  ollamaModel('llama3.1:8b', 'Llama 3.1 8B', 128000, 8192, 'Buyuk baglam alani'),
  ollamaModel('llama3.1:70b', 'Llama 3.1 70B', 128000, 8192, 'En yuksek kalite'),
  ollamaModel('mixtral:latest', 'Mixtral 8x7B', 32768, 32768, 'MoE mimarisi'),
  lmStudioModel('default', 'Varsayilan (LM Studio)', 32768, 4096, 'LM Studio ile yerel'),
  {
    id: 'meta-llama/Meta-Llama-3.1-8B-Instruct:free',
    name: 'Llama 3.1 8B (OpenRouter Ücretsiz)',
    provider: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    contextLength: 128000,
    maxOutput: 8192,
    description: 'OpenRouter ücretsiz tier - API key gerekli'
  },
  {
    id: 'mistralai/Mistral-7B-Instruct-v0.2:free',
    name: 'Mistral 7B (OpenRouter Ücretsiz)',
    provider: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    contextLength: 32768,
    maxOutput: 8192,
    description: 'OpenRouter ücretsiz tier - API key gerekli'
  },
  {
    id: 'huggingfaceh4/zephyr-7b-beta:free',
    name: 'Zephyr 7B (OpenRouter Ücretsiz)',
    provider: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    contextLength: 8192,
    maxOutput: 4096,
    description: 'OpenRouter ücretsiz tier - API key gerekli'
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B (Groq Ücretsiz)',
    provider: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    requiresApiKey: true,
    contextLength: 128000,
    maxOutput: 8192,
    description: 'Groq ücretsiz tier - hızlı yanıt'
  },
  {
    id: 'gemma2-9b-it',
    name: 'Gemma 2 9B (Groq Ücretsiz)',
    provider: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    requiresApiKey: true,
    contextLength: 8192,
    maxOutput: 8192,
    description: 'Groq ücretsiz tier - hızlı yanıt'
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash (Google Ücretsiz)',
    provider: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    requiresApiKey: true,
    contextLength: 1048576,
    maxOutput: 8192,
    description: 'Google ücretsiz tier - 1M context'
  },
  {
    id: '@cf/meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B (Cloudflare Ücretsiz)',
    provider: 'cloudflare',
    baseUrl: 'https://api.cloudflare.com/client/v4',
    requiresApiKey: true,
    contextLength: 8192,
    maxOutput: 4096,
    description: 'Cloudflare Workers AI ücretsiz tier'
  }
];

export class FreeModelsProvider implements AIProvider {
  name = 'free-models';
  displayName = 'Ücretsiz Modeller';
  description = 'Ücretsiz ve rate limit\'siz AI modelleri topluluğu';
  private config: ProviderConfig;
  private selectedModel: FreeModel;

  constructor(config?: ProviderConfig) {
    this.config = config || {};
    this.selectedModel = FREE_MODELS[0];
  }

  async isAvailable(): Promise<boolean> {
    for (const model of FREE_MODELS) {
      if (!model.requiresApiKey) {
        try {
          const response = await fetch(`${model.baseUrl}/api/tags`, {
            signal: AbortSignal.timeout(3000)
          });
          if (response.ok) return true;
        } catch {
          // devam et
        }
      }
    }
    return false;
  }

  async chat(messages: Message[], model?: string, options?: ChatOptions): Promise<ChatResponse> {
    const targetModel = model || options?.model || this.selectedModel.id;
    const freeModel = FREE_MODELS.find(m => m.id === targetModel) || this.selectedModel;

    if (freeModel.provider === 'ollama') {
      return this.chatWithOllama(messages, freeModel, options);
    } else if (freeModel.provider === 'lmstudio') {
      return this.chatWithLMStudio(messages, freeModel, options);
    } else if (freeModel.provider === 'groq') {
      return this.chatWithGroq(messages, freeModel, options);
    } else if (freeModel.provider === 'gemini') {
      return this.chatWithGemini(messages, freeModel, options);
    } else if (freeModel.provider === 'openrouter') {
      return this.chatWithOpenRouter(messages, freeModel, options);
    }

    throw new Error(`Desteklenmeyen ücretsiz model sağlayıcısı: ${freeModel.provider}`);
  }

  async streamChat(messages: Message[], model?: string, options?: StreamOptions): Promise<void> {
    const targetModel = model || options?.model || this.selectedModel.id;
    const freeModel = FREE_MODELS.find(m => m.id === targetModel) || this.selectedModel;

    if (freeModel.provider === 'ollama') {
      return this.streamWithOllama(messages, freeModel, options);
    }

    const response = await this.chat(messages, model, options);
    options?.onToken?.(response.content);
    options?.onDone?.(response.content, response.usage);
  }

  async listModels(): Promise<ModelInfo[]> {
    return FREE_MODELS.map(m => ({
      id: m.id,
      name: m.name,
      contextLength: m.contextLength,
      maxOutput: m.maxOutput,
      pricing: { input: 0, output: 0 }
    }));
  }

  async getModelInfo(modelId: string): Promise<ModelInfo | null> {
    const model = FREE_MODELS.find(m => m.id === modelId);
    if (!model) return null;
    return {
      id: model.id,
      name: model.name,
      contextLength: model.contextLength,
      maxOutput: model.maxOutput,
      pricing: { input: 0, output: 0 }
    };
  }

  selectModel(modelId: string): void {
    const model = FREE_MODELS.find(m => m.id === modelId);
    if (model) this.selectedModel = model;
  }

  getAvailableFreeModels(): FreeModel[] {
    return FREE_MODELS.filter(m => !m.requiresApiKey);
  }

  getAllFreeModels(): FreeModel[] {
    return [...FREE_MODELS];
  }

  private async chatWithOllama(messages: Message[], model: FreeModel, options?: ChatOptions): Promise<ChatResponse> {
    const response = await fetch(`${model.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(60000),
      body: JSON.stringify({
        model: model.id,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: false,
        options: {
          temperature: options?.temperature || 0.7,
          num_predict: options?.maxTokens || 4096,
          top_p: options?.topP
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama hatası: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.message?.content || '',
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      },
      model: model.id,
      finishReason: data.done ? 'stop' : 'length'
    };
  }

  private async streamWithOllama(messages: Message[], model: FreeModel, options?: StreamOptions): Promise<void> {
    const response = await fetch(`${model.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model.id,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: true,
        options: {
          temperature: options?.temperature || 0.7,
          num_predict: options?.maxTokens || 4096,
          top_p: options?.topP
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama hatası: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Okuyucu oluşturulamadı');

    const decoder = new TextDecoder();
    let fullText = '';
    let usage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              fullText += data.message.content;
              options?.onToken?.(data.message.content);
            }
            if (data.done) {
              usage = {
                promptTokens: data.prompt_eval_count || 0,
                completionTokens: data.eval_count || 0,
                totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
              };
            }
          } catch { /* ignored */ }
        }
      }
    } finally {
      reader.releaseLock();
    }

    options?.onDone?.(fullText, usage);
  }

  private async chatWithLMStudio(messages: Message[], model: FreeModel, options?: ChatOptions): Promise<ChatResponse> {
    const response = await fetch(`${model.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(60000),
      body: JSON.stringify({
        model: model.id,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 4096
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LM Studio hatası: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      model: model.id,
      finishReason: data.choices?.[0]?.finish_reason || 'stop'
    };
  }

  private async chatWithGroq(messages: Message[], model: FreeModel, options?: ChatOptions): Promise<ChatResponse> {
    const apiKey = this.config.apiKey || process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('Groq API key gerekli');

    const response = await fetch(`${model.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model: model.id,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 4096
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq hatası: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      model: model.id,
      finishReason: data.choices?.[0]?.finish_reason || 'stop'
    };
  }

  private async chatWithGemini(messages: Message[], model: FreeModel, options?: ChatOptions): Promise<ChatResponse> {
    const apiKey = this.config.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API key gerekli');

    const contents: any[] = [];
    let systemInstruction: any = undefined;

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = { parts: [{ text: msg.content }] };
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }

    const body: any = {
      contents,
      generationConfig: {
        temperature: options?.temperature || 0.7,
        maxOutputTokens: options?.maxTokens || 4096,
        topP: options?.topP
      }
    };
    if (systemInstruction) body.systemInstruction = systemInstruction;

    const response = await fetch(`${model.baseUrl}/models/${model.id}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(60000),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini hatası: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0
      },
      model: model.id,
      finishReason: data.candidates?.[0]?.finishReason || 'STOP'
    };
  }

  private async chatWithOpenRouter(messages: Message[], model: FreeModel, options?: ChatOptions): Promise<ChatResponse> {
    const apiKey = this.config.apiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OpenRouter API key gerekli');

    const response = await fetch(`${model.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Arya IDE'
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model: model.id,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 4096
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter hatası: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      model: model.id,
      finishReason: data.choices?.[0]?.finish_reason || 'stop'
    };
  }
}
