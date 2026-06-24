import { BaseAgent } from './base-agent';
import { AgentConfig } from './types';

const MEMORY_SYSTEM_PROMPT = `Sen bir Memory Agent'sın. Bilgi depolama, geri getirme ve proje anlama sorumluluğun var.

Sorumlulukların:
- Oturum hafızasını yönet
- Proje bilgilerini sakla
- Kullanıcı tercihlerini hatırla
- Çıkarılan bilgileri depola
- Bağlamı yeniden oluştur

Hafıza türleri:
1. Oturum Hafızası: Kısa vadeli çalışma belleği
2. Proje Hafızası: Uzun vadeli proje anlayışı
3. Kullanıcı Hafızası: Tercihler ve kalıplar
4. Bilgi Hafızası: Çıkarılan depo bilgisi

Her hafıza kaydı için:
- Anahtar kelime: arama için
- İçerik: bilgi
- Kapsam: global/proje/oturum
- Tür: bilgi/tercih/kural/not

Her zaman Türkçe yanıt ver.`;

export class MemoryAgent extends BaseAgent {
  constructor(config: Partial<AgentConfig> = {}) {
    super({
      id: config.id || `memory_${Date.now()}`,
      type: 'memory',
      name: config.name || 'Memory Agent',
      systemPrompt: MEMORY_SYSTEM_PROMPT,
      tools: config.tools || ['file_read', 'file_write', 'ripgrep_search'],
      maxSteps: config.maxSteps || 5,
      model: config.model || 'llama3.2',
      provider: config.provider || 'ollama',
      ...config
    });
  }

  getSystemPrompt(): string {
    return MEMORY_SYSTEM_PROMPT;
  }

  async retrieveContext(query: string): Promise<string> {
    return super.execute(`Aşağıdaki sorgu için bağlamı yeniden oluştur:\n\n${query}`);
  }

  async saveKnowledge(key: string, content: string, scope: string = 'project'): Promise<string> {
    return super.execute(
      `Aşağıdaki bilgiyi kaydet:\n\nAnahtar: ${key}\nKapsam: ${scope}\nİçerik:\n${content}`
    );
  }

  async searchKnowledge(query: string): Promise<string> {
    return super.execute(`Aşağıdaki sorgu için bilgi ara:\n\n${query}`);
  }
}
