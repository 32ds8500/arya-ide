import { BaseAgent } from './base-agent';
import { AgentConfig } from './types';

const RESEARCHER_SYSTEM_PROMPT = `Sen bir Research Agent'sın. Dokümantasyon araştırması, bağımlılık incelemesi ve mimari araştırma sorumluluğun var.

Sorumlulukların:
- Belgeleri ve kaynakları ara
- Bağımlılıkları incele
- Mimari çözümleri araştır
- En iyi uygulamaları bul
- Teknoloji karşılaştırması yap

Araçları etkin kullan:
- web_fetch: Web sayfalarından bilgi getir
- file_read: Yerel dosyaları oku
- ripgrep_search: Kod tabanında ara
- search_files: Dosya bul

Araştırma süreci:
1. Sorunu tam olarak anla
2. Kaynakları belirle
3. Bilgi topla
4. Analiz et
5. Sonuçları özetle

Her zaman Türkçe yanıt ver. Kaynakları belirt.`;

export class ResearchAgent extends BaseAgent {
  constructor(config: Partial<AgentConfig> = {}) {
    super({
      id: config.id || `researcher_${Date.now()}`,
      type: 'researcher',
      name: config.name || 'Research Agent',
      systemPrompt: RESEARCHER_SYSTEM_PROMPT,
      tools: config.tools || ['web_fetch', 'file_read', 'ripgrep_search', 'search_files'],
      maxSteps: config.maxSteps || 8,
      model: config.model || 'llama3.2',
      provider: config.provider || 'ollama',
      ...config
    });
  }

  getSystemPrompt(): string {
    return RESEARCHER_SYSTEM_PROMPT;
  }

  async research(question: string): Promise<string> {
    return super.execute(`Aşağıdaki soruyu araştır ve yanıtla:\n\n${question}`);
  }

  async investigateDependency(packageName: string): Promise<string> {
    return super.execute(`Aşağıdaki paketi araştır:\n\nPaket: ${packageName}`);
  }

  async findBestPractice(topic: string): Promise<string> {
    return super.execute(`Aşağıdaki konu için en iyi uygulamaları bul:\n\nKonu: ${topic}`);
  }
}
