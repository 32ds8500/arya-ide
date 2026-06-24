import { ContextWindow, ContextMessage, CompressedContext, ContextConfig } from './types';
import { createProvider, ProviderName } from '../providers';

const DEFAULT_CONFIG: ContextConfig = {
  maxTokens: 8192,
  compressionThreshold: 0.7,
  priorityWeight: 0.4,
  recencyWeight: 0.3,
  importanceWeight: 0.3
};

export class ContextManager {
  private window: ContextWindow;
  private config: ContextConfig;

  constructor(config: Partial<ContextConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.window = {
      messages: [],
      totalTokens: 0,
      maxTokens: this.config.maxTokens
    };
  }

  addMessage(role: 'system' | 'user' | 'assistant', content: string, priority: number = 1): void {
    const tokens = this.estimateTokens(content);
    const message: ContextMessage = {
      role,
      content,
      tokens,
      priority,
      timestamp: new Date()
    };

    this.window.messages.push(message);
    this.window.totalTokens += tokens;

    if (this.window.totalTokens > this.window.maxTokens * this.config.compressionThreshold) {
      this.compress();
    }
  }

  compress(): void {
    const systemMessages = this.window.messages.filter(m => m.role === 'system');
    const nonSystemMessages = this.window.messages.filter(m => m.role !== 'system');

    if (nonSystemMessages.length <= 2) return;

    const scored = nonSystemMessages.map(m => ({
      message: m,
      score: this.calculateScore(m)
    }));

    scored.sort((a, b) => b.score - a.score);

    const keepCount = Math.max(2, Math.floor(nonSystemMessages.length * 0.5));
    const kept = scored.slice(0, keepCount).map(s => s.message);
    kept.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const removed = scored.slice(keepCount).map(s => s.message);
    const summary = this.generateSummary(removed);

    this.window.messages = [
      ...systemMessages,
      {
        role: 'system',
        content: `Önceki konuşma özeti:\n${summary}`,
        tokens: this.estimateTokens(summary),
        priority: 0,
        timestamp: new Date()
      },
      ...kept
    ];

    this.window.totalTokens = this.window.messages.reduce((sum, m) => sum + m.tokens, 0);
  }

  reconstruct(): ContextMessage[] {
    return [...this.window.messages];
  }

  prioritize(): ContextMessage[] {
    return [...this.window.messages].sort((a, b) => {
      if (a.role === 'system' && b.role !== 'system') return -1;
      if (a.role !== 'system' && b.role === 'system') return 1;
      return b.priority - a.priority;
    });
  }

  getTokenBudget(): { used: number; remaining: number; percentage: number } {
    const used = this.window.totalTokens;
    const remaining = this.window.maxTokens - used;
    return {
      used,
      remaining,
      percentage: (used / this.window.maxTokens) * 100
    };
  }

  fitsInBudget(content: string): boolean {
    const tokens = this.estimateTokens(content);
    return this.window.totalTokens + tokens <= this.window.maxTokens;
  }

  trimToBudget(maxTokens?: number): void {
    const limit = maxTokens || this.window.maxTokens;

    while (this.window.totalTokens > limit && this.window.messages.length > 1) {
      const nonSystem = this.window.messages.filter(m => m.role !== 'system');
      if (nonSystem.length === 0) break;

      let minScore = Infinity;
      let minIdx = -1;

      for (let i = 0; i < this.window.messages.length; i++) {
        const m = this.window.messages[i];
        if (m.role === 'system') continue;
        const score = this.calculateScore(m);
        if (score < minScore) {
          minScore = score;
          minIdx = i;
        }
      }

      if (minIdx >= 0) {
        const removed = this.window.messages.splice(minIdx, 1)[0];
        this.window.totalTokens -= removed.tokens;
      }
    }
  }

  clear(): void {
    this.window.messages = [];
    this.window.totalTokens = 0;
  }

  getMessages(): ContextMessage[] {
    return [...this.window.messages];
  }

  private calculateScore(message: ContextMessage): number {
    const recencyScore = 1 / (1 + (Date.now() - message.timestamp.getTime()) / 3600000);
    const priorityScore = message.priority / 5;
    const importanceScore = message.role === 'user' ? 0.8 : message.role === 'assistant' ? 0.6 : 0.4;

    return (
      recencyScore * this.config.recencyWeight +
      priorityScore * this.config.priorityWeight +
      importanceScore * this.config.importanceWeight
    );
  }

  private generateSummary(messages: ContextMessage[]): string {
    const contents = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    return contents.length > 500 ? contents.substring(0, 500) + '...' : contents;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  async compressWithAI(messages: ContextMessage[]): Promise<CompressedContext> {
    try {
      const provider = createProvider('ollama' as ProviderName);
      const content = messages.map(m => `${m.role}: ${m.content}`).join('\n');

      const response = await provider.chat([
        {
          role: 'system',
          content: 'Sen bir metin sıkıştırma asistanısın. Verilen konuşmayı özetle. Önemli noktaları koru, gereksiz detayları çıkar. Türkçe yanıt ver.'
        },
        {
          role: 'user',
          content: `Bu konuşmayı özetle:\n\n${content}`
        }
      ], 'llama3.2', { maxTokens: 1024 });

      return {
        summary: response.content,
        keyPoints: response.content.split('\n').filter(l => l.trim()).slice(0, 5),
        tokenCount: this.estimateTokens(response.content)
      };
    } catch {
      const fallback = this.generateSummary(messages);
      return {
        summary: fallback,
        keyPoints: [],
        tokenCount: this.estimateTokens(fallback)
      };
    }
  }
}
