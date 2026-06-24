import { AIProvider, Message, ChatOptions, StreamOptions, ChatResponse, TokenUsage, ModelInfo, ProviderConfig } from './base';

export class HuggingFaceProvider implements AIProvider {
  name = 'huggingface';
  displayName = 'HuggingFace';
  description = 'HuggingFace Inference API ile çalışma';
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || '';
    this.baseUrl = config.baseUrl || 'https://api-inference.huggingface.co';
    this.timeout = config?.timeout || 60000;
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey.length > 0;
  }

  async chat(messages: Message[], model?: string, options?: ChatOptions): Promise<ChatResponse> {
    const targetModel = model || options?.model || 'meta-llama/Llama-3.1-8B-Instruct';
    const formattedMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    const response = await fetch(`${this.baseUrl}/models/${targetModel}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      signal: AbortSignal.timeout(this.timeout),
      body: JSON.stringify({
        messages: formattedMessages,
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
      throw new Error(`HuggingFace API hatası: ${response.status} - ${error}`);
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
      model: targetModel,
      finishReason: choice?.finish_reason || 'stop'
    };
  }

  async streamChat(messages: Message[], model?: string, options?: StreamOptions): Promise<void> {
    const targetModel = model || options?.model || 'meta-llama/Llama-3.1-8B-Instruct';
    const formattedMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    const response = await fetch(`${this.baseUrl}/models/${targetModel}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        messages: formattedMessages,
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
      throw new Error(`HuggingFace API hatası: ${response.status} - ${error}`);
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
      { id: 'meta-llama/Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B', contextLength: 131072, maxOutput: 4096, pricing: { input: 0.0002, output: 0.0002 } },
      { id: 'meta-llama/Llama-3.1-70B-Instruct', name: 'Llama 3.1 70B', contextLength: 131072, maxOutput: 4096, pricing: { input: 0.0009, output: 0.0009 } },
      { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B', contextLength: 32768, maxOutput: 4096, pricing: { input: 0.00024, output: 0.00024 } },
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B', contextLength: 32768, maxOutput: 8192, pricing: { input: 0.0009, output: 0.0009 } },
    ];
  }

  async getModelInfo(modelId: string): Promise<ModelInfo | null> {
    const models = await this.listModels();
    return models.find(m => m.id === modelId) || null;
  }
}
