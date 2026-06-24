import { AIProvider, Message, ChatOptions, StreamOptions, ChatResponse, TokenUsage, ModelInfo, ProviderConfig } from './base';

export class GroqProvider implements AIProvider {
  name = 'groq';
  displayName = 'Groq';
  description = 'Groq API ile hızlı yanıt alma';
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || '';
    this.baseUrl = config.baseUrl || 'https://api.groq.com/openai/v1';
    this.timeout = config?.timeout || 30000;
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey.length > 0;
  }

  async chat(messages: Message[], model?: string, options?: ChatOptions): Promise<ChatResponse> {
    const targetModel = model || options?.model || 'llama-3.1-70b-versatile';
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
      throw new Error(`Groq API hatası: ${response.status} - ${error}`);
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
    const targetModel = model || options?.model || 'llama-3.1-70b-versatile';
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
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
      throw new Error(`Groq API hatası: ${response.status} - ${error}`);
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
            if (parsed.x_groq?.usage) {
              usage = {
                promptTokens: parsed.x_groq.usage.prompt_tokens,
                completionTokens: parsed.x_groq.usage.completion_tokens,
                totalTokens: parsed.x_groq.usage.total_tokens
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
      { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', contextLength: 128000, maxOutput: 32768, pricing: { input: 0.00059, output: 0.00079 } },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', contextLength: 128000, maxOutput: 8192, pricing: { input: 0.00005, output: 0.00008 } },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', contextLength: 32768, maxOutput: 32768, pricing: { input: 0.00024, output: 0.00024 } },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', contextLength: 8192, maxOutput: 8192, pricing: { input: 0.0002, output: 0.0002 } },
    ];
  }

  async getModelInfo(modelId: string): Promise<ModelInfo | null> {
    const models = await this.listModels();
    return models.find(m => m.id === modelId) || null;
  }
}
