import { AIProvider, Message, ChatOptions, StreamOptions, ChatResponse, TokenUsage, ModelInfo, ProviderConfig } from './base';

const RECOMMENDED_MODELS = [
  { id: 'llama3.2', name: 'Llama 3.2 3B', context: 128000, output: 4096, desc: 'Hafif ve hızlı, günlük kullanım için' },
  { id: 'llama3.2:latest', name: 'Llama 3.2', context: 128000, output: 4096, desc: 'Güncel sürüm' },
  { id: 'mistral:latest', name: 'Mistral 7B', context: 32768, output: 4096, desc: 'Dengeli performans' },
  { id: 'codellama:latest', name: 'Code Llama', context: 16384, output: 4096, desc: 'Kod yazma için optimize' },
  { id: 'deepseek-coder:latest', name: 'DeepSeek Coder', context: 16384, output: 4096, desc: 'Profesyonel kod yazma' },
  { id: 'qwen2.5-coder:latest', name: 'Qwen 2.5 Coder', context: 32768, output: 8192, desc: 'Çok dilli kod yazma' },
  { id: 'phi3:latest', name: 'Phi-3 Mini', context: 128000, output: 4096, desc: 'Microsoft küçük model' },
  { id: 'gemma2:latest', name: 'Gemma 2', context: 8192, output: 4096, desc: 'Google modeli' },
  { id: 'nomic-embed-text', name: 'Nomic Embed', context: 8192, output: 0, desc: 'Vektör gömme için' },
  { id: 'llama3.1:8b', name: 'Llama 3.1 8B', context: 128000, output: 8192, desc: 'Büyük bağlam alanı' },
  { id: 'llama3.1:70b', name: 'Llama 3.1 70B', context: 128000, output: 8192, desc: 'En yüksek kalite (yavaş)' },
  { id: 'mixtral:latest', name: 'Mixtral 8x7B', context: 32768, output: 32768, desc: 'MoE mimarisi, yüksek kalite' },
  { id: 'vicuna:latest', name: 'Vicuna', context: 2048, output: 2048, desc: 'Sohbet odaklı' },
  { id: 'neural-chat:latest', name: 'Neural Chat', context: 8192, output: 8192, desc: 'Intel sohbet modeli' },
  { id: 'starling-lm:latest', name: 'Starling LM', context: 8192, output: 8192, desc: 'RLHF ile eğitilmiş' },
];

export class OllamaProvider implements AIProvider {
  name = 'ollama';
  displayName = 'Ollama';
  description = 'Yerel Ollama API - Ucretsiz ve sinirsiz';
  private baseUrl: string;
  private timeout: number;
  private cachedModels: ModelInfo[] = [];

  constructor(config?: ProviderConfig) {
    this.baseUrl = config?.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.timeout = config?.timeout || 120000;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async chat(messages: Message[], model?: string, options?: ChatOptions): Promise<ChatResponse> {
    const targetModel = model || options?.model || 'llama3.2';
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(this.timeout),
      body: JSON.stringify({
        model: targetModel,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: false,
        options: {
          temperature: options?.temperature,
          num_predict: options?.maxTokens,
          top_p: options?.topP,
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama hatasi: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const usage: TokenUsage = {
      promptTokens: data.prompt_eval_count || 0,
      completionTokens: data.eval_count || 0,
      totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
    };

    return {
      content: data.message?.content || '',
      usage,
      model: targetModel,
      finishReason: data.done ? 'stop' : 'length'
    };
  }

  async streamChat(messages: Message[], model?: string, options?: StreamOptions): Promise<void> {
    const targetModel = model || options?.model || 'llama3.2';
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: targetModel,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: true,
        options: {
          temperature: options?.temperature,
          num_predict: options?.maxTokens,
          top_p: options?.topP,
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama hatasi: ${response.status} - ${error}`);
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

  async listModels(): Promise<ModelInfo[]> {
    if (this.cachedModels.length > 0) return this.cachedModels;

    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        this.cachedModels = this.getRecommendedModels();
        return this.cachedModels;
      }

      const data = await response.json();
      const installedModels = (data.models || []).map((m: any) => ({
        id: m.name,
        name: m.name,
        contextLength: this.estimateContextLength(m.name),
        maxOutput: 4096,
        pricing: { input: 0, output: 0 }
      }));

      this.cachedModels = installedModels.length > 0 ? installedModels : this.getRecommendedModels();
      return this.cachedModels;
    } catch {
      this.cachedModels = this.getRecommendedModels();
      return this.cachedModels;
    }
  }

  async getModelInfo(modelId: string): Promise<ModelInfo | null> {
    const models = await this.listModels();
    return models.find(m => m.id === modelId) || null;
  }

  getRecommendedModels(): ModelInfo[] {
    return RECOMMENDED_MODELS.map(m => ({
      id: m.id,
      name: m.name,
      contextLength: m.context,
      maxOutput: m.output,
      pricing: { input: 0, output: 0 }
    }));
  }

  async pullModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async deleteModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getModelStats(): Promise<{ totalModels: number; installedModels: string[]; recommendedModels: string[] }> {
    const models = await this.listModels();
    return {
      totalModels: models.length,
      installedModels: models.map(m => m.id),
      recommendedModels: RECOMMENDED_MODELS.map(m => m.id)
    };
  }

  private estimateContextLength(modelName: string): number {
    if (modelName.includes('3.1')) return 128000;
    if (modelName.includes('3.2')) return 128000;
    if (modelName.includes('mistral') || modelName.includes('mixtral')) return 32768;
    if (modelName.includes('codellama') || modelName.includes('deepseek')) return 16384;
    if (modelName.includes('phi3') || modelName.includes('phi-3')) return 128000;
    if (modelName.includes('gemma')) return 8192;
    return 4096;
  }
}
