import { AIProvider, Message, ChatOptions, StreamOptions, ChatResponse, ModelInfo, ProviderConfig } from './base';

export class CloudflareProvider implements AIProvider {
  name = 'cloudflare';
  displayName = 'Cloudflare AI';
  description = 'Cloudflare AI API ile çalışma';
  private apiKey: string;
  private accountId: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || '';
    this.accountId = config.organization || '';
    this.baseUrl = config.baseUrl || 'https://api.cloudflare.com/client/v4';
    this.timeout = config?.timeout || 60000;
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey.length > 0 && this.accountId.length > 0;
  }

  async chat(messages: Message[], model?: string, options?: ChatOptions): Promise<ChatResponse> {
    const targetModel = model || options?.model || '@cf/meta/llama-3.1-8b-instruct';
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const body: any = {
      messages: chatMessages,
      max_tokens: options?.maxTokens || 2048,
      temperature: options?.temperature,
      top_p: options?.topP,
    };
    if (systemMessage) body.system = systemMessage.content;

    const response = await fetch(`${this.baseUrl}/accounts/${this.accountId}/ai/run/${targetModel}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      signal: AbortSignal.timeout(this.timeout),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudflare AI hatası: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.result?.response || '';

    return {
      content,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      model: targetModel,
      finishReason: 'stop'
    };
  }

  async streamChat(messages: Message[], model?: string, options?: StreamOptions): Promise<void> {
    const targetModel = model || options?.model || '@cf/meta/llama-3.1-8b-instruct';
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const body: any = {
      messages: chatMessages,
      max_tokens: options?.maxTokens || 2048,
      temperature: options?.temperature,
      top_p: options?.topP,
      stream: true
    };
    if (systemMessage) body.system = systemMessage.content;

    const response = await fetch(`${this.baseUrl}/accounts/${this.accountId}/ai/run/${targetModel}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudflare AI hatası: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Okuyucu oluşturulamadı');

    const decoder = new TextDecoder();
    let fullText = '';

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
            const token = parsed.response;
            if (token) {
              fullText += token;
              options?.onToken?.(token);
            }
          } catch { /* ignored */ }
        }
      }
    } finally {
      reader.releaseLock();
    }

    options?.onDone?.(fullText, { promptTokens: 0, completionTokens: 0, totalTokens: 0 });
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      { id: '@cf/meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', contextLength: 8192, maxOutput: 2048, pricing: { input: 0, output: 0 } },
      { id: '@cf/meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', contextLength: 8192, maxOutput: 2048, pricing: { input: 0.00075, output: 0.001 } },
      { id: '@cf/mistral/mistral-7b-instruct-v0.2', name: 'Mistral 7B', contextLength: 8192, maxOutput: 2048, pricing: { input: 0, output: 0 } },
      { id: '@cf/qwen/qwen1.5-14b-chat-awq', name: 'Qwen 1.5 14B', contextLength: 8192, maxOutput: 2048, pricing: { input: 0, output: 0 } },
    ];
  }

  async getModelInfo(modelId: string): Promise<ModelInfo | null> {
    const models = await this.listModels();
    return models.find(m => m.id === modelId) || null;
  }
}
