import { AIProvider, Message, ChatOptions, StreamOptions, ChatResponse, TokenUsage, ModelInfo, ProviderConfig } from './base';

export class GitHubModelsProvider implements AIProvider {
  name = 'github-models';
  displayName = 'GitHub Models';
  description = 'GitHub Models API ile çalışma';
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || '';
    this.baseUrl = config.baseUrl || 'https://models.inference.ai.azure.com';
    this.timeout = config?.timeout || 60000;
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey.length > 0;
  }

  async chat(messages: Message[], model?: string, options?: ChatOptions): Promise<ChatResponse> {
    const targetModel = model || options?.model || 'gpt-4o';
    const response = await fetch(`${this.baseUrl}/${targetModel}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      signal: AbortSignal.timeout(this.timeout),
      body: JSON.stringify({
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stop
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub Models API hatası: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const usage: TokenUsage = {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0
    };

    return {
      content: choice?.message?.content || '',
      usage,
      model: data.model || targetModel,
      finishReason: choice?.finish_reason || 'stop'
    };
  }

  async streamChat(messages: Message[], model?: string, options?: StreamOptions): Promise<void> {
    const targetModel = model || options?.model || 'gpt-4o';
    const response = await fetch(`${this.baseUrl}/${targetModel}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stop,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub Models API hatası: ${response.status} - ${error}`);
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
                promptTokens: parsed.usage.prompt_tokens,
                completionTokens: parsed.usage.completion_tokens,
                totalTokens: parsed.usage.total_tokens
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

  async listModels(): Promise<ModelInfo[]> {
    return [
      { id: 'gpt-4o', name: 'GPT-4o', contextLength: 128000, maxOutput: 16384, pricing: { input: 0.0025, output: 0.01 } },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextLength: 128000, maxOutput: 16384, pricing: { input: 0.00015, output: 0.0006 } },
      { id: 'Phi-3.5', name: 'Phi 3.5', contextLength: 128000, maxOutput: 4096, pricing: { input: 0.0001, output: 0.0001 } },
      { id: 'Llama-3.1-405B', name: 'Llama 3.1 405B', contextLength: 131072, maxOutput: 4096, pricing: { input: 0.003, output: 0.003 } },
      { id: 'Llama-3.1-70B', name: 'Llama 3.1 70B', contextLength: 131072, maxOutput: 4096, pricing: { input: 0.0009, output: 0.0009 } },
    ];
  }

  async getModelInfo(modelId: string): Promise<ModelInfo | null> {
    const models = await this.listModels();
    return models.find(m => m.id === modelId) || null;
  }
}
