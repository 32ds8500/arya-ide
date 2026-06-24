import { AIProvider, Message, ChatOptions, StreamOptions, ChatResponse, TokenUsage, ModelInfo, ProviderConfig } from './base';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  displayName = 'Google Gemini';
  description = 'Google Gemini API ile çalışma';
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || '';
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    this.timeout = config?.timeout || 60000;
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey.length > 0;
  }

  private convertMessages(messages: Message[]): { contents: any[], systemInstruction?: any } {
    let systemInstruction = undefined;
    const contents: any[] = [];

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

    return { contents, systemInstruction };
  }

  async chat(messages: Message[], model?: string, options?: ChatOptions): Promise<ChatResponse> {
    const targetModel = model || options?.model || 'gemini-pro';
    const { contents, systemInstruction } = this.convertMessages(messages);

    const body: any = {
      contents,
      generationConfig: {
        temperature: options?.temperature,
        maxOutputTokens: options?.maxTokens,
        topP: options?.topP,
        stopSequences: options?.stop,
      }
    };
    if (systemInstruction) body.systemInstruction = systemInstruction;

    const response = await fetch(`${this.baseUrl}/models/${targetModel}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(this.timeout),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API hatası: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const usage: TokenUsage = {
      promptTokens: data.usageMetadata?.promptTokenCount || 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: data.usageMetadata?.totalTokenCount || 0
    };

    return {
      content: text,
      usage,
      model: targetModel,
      finishReason: data.candidates?.[0]?.finishReason || 'STOP'
    };
  }

  async streamChat(messages: Message[], model?: string, options?: StreamOptions): Promise<void> {
    const targetModel = model || options?.model || 'gemini-pro';
    const { contents, systemInstruction } = this.convertMessages(messages);

    const body: any = {
      contents,
      generationConfig: {
        temperature: options?.temperature,
        maxOutputTokens: options?.maxTokens,
        topP: options?.topP,
        stopSequences: options?.stop,
      }
    };
    if (systemInstruction) body.systemInstruction = systemInstruction;

    const response = await fetch(`${this.baseUrl}/models/${targetModel}:streamGenerateContent?alt=sse&key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API hatası: ${response.status} - ${error}`);
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
            const token = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (token) {
              fullText += token;
              options?.onToken?.(token);
            }
            if (parsed.usageMetadata) {
              usage = {
                promptTokens: parsed.usageMetadata.promptTokenCount || 0,
                completionTokens: parsed.usageMetadata.candidatesTokenCount || 0,
                totalTokens: parsed.usageMetadata.totalTokenCount || 0
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
      { id: 'gemini-pro', name: 'Gemini Pro', contextLength: 32760, maxOutput: 8192, pricing: { input: 0.00025, output: 0.0005 } },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', contextLength: 1048576, maxOutput: 8192, pricing: { input: 0.00125, output: 0.005 } },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', contextLength: 1048576, maxOutput: 8192, pricing: { input: 0.000075, output: 0.0003 } },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', contextLength: 1048576, maxOutput: 8192, pricing: { input: 0.0001, output: 0.0004 } },
    ];
  }

  async getModelInfo(modelId: string): Promise<ModelInfo | null> {
    const models = await this.listModels();
    return models.find(m => m.id === modelId) || null;
  }
}
