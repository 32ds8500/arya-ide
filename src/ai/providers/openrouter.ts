import { AIProvider, Message, ChatOptions, StreamOptions, ChatResponse, TokenUsage, ModelInfo, ProviderConfig } from './base';

export class OpenRouterProvider implements AIProvider {
  name = 'openrouter';
  displayName = 'OpenRouter';
  description = 'OpenRouter API ile çoklu model desteği';
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || '';
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
    this.timeout = config?.timeout || 60000;
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey.length > 0;
  }

  async chat(messages: Message[], model?: string, options?: ChatOptions): Promise<ChatResponse> {
    const targetModel = model || options?.model || 'openai/gpt-3.5-turbo';
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://aryaide.com',
        'X-Title': 'Arya IDE'
      },
      signal: AbortSignal.timeout(this.timeout),
      body: JSON.stringify({
        model: targetModel,
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
      throw new Error(`OpenRouter API hatası: ${response.status} - ${error}`);
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
    const targetModel = model || options?.model || 'openai/gpt-3.5-turbo';
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://aryaide.com',
        'X-Title': 'Arya IDE'
      },
      body: JSON.stringify({
        model: targetModel,
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
      throw new Error(`OpenRouter API hatası: ${response.status} - ${error}`);
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
          } catch {}
        }
      }
    } finally {
      reader.releaseLock();
    }

    options?.onDone?.(fullText, usage);
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      if (!response.ok) return [];

      const data = await response.json();
      return (data.data || []).map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        contextLength: m.context_length || 4096,
        maxOutput: m.max_completion_tokens || 2048,
        pricing: {
          input: parseFloat(m.pricing?.prompt || '0'),
          output: parseFloat(m.pricing?.completion || '0')
        }
      }));
    } catch {
      return [];
    }
  }

  async getModelInfo(modelId: string): Promise<ModelInfo | null> {
    const models = await this.listModels();
    return models.find(m => m.id === modelId) || null;
  }
}
