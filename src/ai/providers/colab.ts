import { AIProvider, Message, ChatOptions, StreamOptions, ChatResponse, TokenUsage, ModelInfo, ProviderConfig } from './base';

export class ColabProvider implements AIProvider {
  name = 'colab';
  displayName = 'Colab Ollama';
  description = 'Google Colab uzerinde calisan Ollama sunucusu (OpenAI uyumlu)';
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config?: ProviderConfig) {
    this.apiKey = config?.apiKey || 'colab-ollama';
    this.baseUrl = config?.baseUrl
      || process.env.OPENAI_BASE_URL
      || process.env.OLLAMA_BASE_URL
      || 'http://localhost:11434';
    this.timeout = config?.timeout || 120000;
  }

  async isAvailable(): Promise<boolean> {
    try {
      // OpenAI format
      const r1 = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(5000)
      });
      if (r1.ok) return true;

      // Ollama format
      const r2 = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      });
      return r2.ok;
    } catch {
      return false;
    }
  }

  async chat(messages: Message[], model?: string, options?: ChatOptions): Promise<ChatResponse> {
    const targetModel = model || options?.model || 'qwen2.5-coder:7b';

    // OpenAI format dene
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        signal: AbortSignal.timeout(this.timeout),
        body: JSON.stringify({
          model: targetModel,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 4096,
          top_p: options?.topP
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          content: data.choices?.[0]?.message?.content || '',
          usage: {
            promptTokens: data.usage?.prompt_tokens || 0,
            completionTokens: data.usage?.completion_tokens || 0,
            totalTokens: data.usage?.total_tokens || 0
          },
          model: data.model || targetModel,
          finishReason: data.choices?.[0]?.finish_reason || 'stop'
        };
      }
    } catch {}

    // Ollama format dene
    const ollamaResponse = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(this.timeout),
      body: JSON.stringify({
        model: targetModel,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: false,
        options: {
          temperature: options?.temperature || 0.7,
          num_predict: options?.maxTokens || 4096
        }
      })
    });

    if (!ollamaResponse.ok) {
      const error = await ollamaResponse.text();
      throw new Error(`Colab API hatasi: ${ollamaResponse.status} - ${error}`);
    }

    const data = await ollamaResponse.json();
    return {
      content: data.message?.content || '',
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      },
      model: targetModel,
      finishReason: data.done ? 'stop' : 'length'
    };
  }

  async streamChat(messages: Message[], model?: string, options?: StreamOptions): Promise<void> {
    const targetModel = model || options?.model || 'qwen2.5-coder:7b';

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: targetModel,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 4096,
        top_p: options?.topP,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Colab API hatasi: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Okuyucu olusturulamadi');

    const decoder = new TextDecoder();
    let fullText = '';
    let usage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              fullText += token;
              options?.onToken?.(token);
            }
            if (parsed.usage) {
              usage = {
                promptTokens: parsed.usage.prompt_tokens || 0,
                completionTokens: parsed.usage.completion_tokens || 0,
                totalTokens: parsed.usage.total_tokens || 0
              };
            }
          } catch {}
        }
      }
    } finally {
      reader.releaseLock();
    }

    options?.onDone?.(fullText, usage);
  }

  async listModels(): Promise<ModelInfo[]> {
    // OpenAI format dene
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        const models = (data.data || []).map((m: any) => ({
          id: m.id,
          name: m.id,
          contextLength: 128000,
          maxOutput: 4096,
          pricing: { input: 0, output: 0 }
        }));
        if (models.length > 0) return models;
      }
    } catch {}

    // Ollama format dene
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        const models = (data.models || []).map((m: any) => ({
          id: m.name,
          name: m.name,
          contextLength: 128000,
          maxOutput: 4096,
          pricing: { input: 0, output: 0 }
        }));
        if (models.length > 0) return models;
      }
    } catch {}

    return this.getDefaultModels();
  }

  async getModelInfo(modelId: string): Promise<ModelInfo | null> {
    const models = await this.listModels();
    return models.find(m => m.id === modelId) || null;
  }

  private getDefaultModels(): ModelInfo[] {
    return [
      { id: 'qwen2.5-coder:7b', name: 'Qwen 2.5 Coder 7B', contextLength: 128000, maxOutput: 8192, pricing: { input: 0, output: 0 } },
      { id: 'llama3.2', name: 'Llama 3.2', contextLength: 128000, maxOutput: 4096, pricing: { input: 0, output: 0 } },
      { id: 'llama3.1:8b', name: 'Llama 3.1 8B', contextLength: 128000, maxOutput: 8192, pricing: { input: 0, output: 0 } },
      { id: 'codellama:7b', name: 'Code Llama 7B', contextLength: 16384, maxOutput: 4096, pricing: { input: 0, output: 0 } },
      { id: 'mistral:7b', name: 'Mistral 7B', contextLength: 32768, maxOutput: 4096, pricing: { input: 0, output: 0 } }
    ];
  }
}
