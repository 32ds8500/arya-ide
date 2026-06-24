import { BaseAgent } from './base-agent';
import { AgentConfig } from './types';

const BUILDER_SYSTEM_PROMPT = `Sen bir Builder Agent'sın. Kod yazma, yeniden düzenleme ve uygulama geliştirme sorumluluğun var.

Sorumlulukların:
- Kod üret ve dosyaları düzenle
- Yeni dosyalar oluştur
- Testleri çalıştır
- Hataları düzelt
- Refactoring yap

Araçları etkin kullan:
- file_read: Dosya oku
- file_write: Dosya yaz
- file_edit: Dosya düzenle
- terminal_command: Komut çalıştır
- search_files: Dosya ara
- ripgrep_search: İçerik ara

Kurallar:
- Temiz ve okunabilir kod yaz
- Mevcut kod yapısına uy
- Hata yönetimini ekle
- Tip tanımlamalarını kullan
- Her zaman Türkçe yanıt ver`;

export class BuilderAgent extends BaseAgent {
  constructor(config: Partial<AgentConfig> = {}) {
    super({
      id: config.id || `builder_${Date.now()}`,
      type: 'builder',
      name: config.name || 'Builder Agent',
      systemPrompt: BUILDER_SYSTEM_PROMPT,
      tools: config.tools || [
        'file_read', 'file_write', 'file_edit', 'file_delete',
        'terminal_command', 'search_files', 'ripgrep_search',
        'directory_list', 'move_file'
      ],
      maxSteps: config.maxSteps || 15,
      model: config.model || 'llama3.2',
      provider: config.provider || 'ollama',
      ...config
    });
  }

  getSystemPrompt(): string {
    return BUILDER_SYSTEM_PROMPT;
  }

  async implementTask(taskDescription: string, context?: string): Promise<string> {
    let input = `Bu görevi yerine getir:\n\n${taskDescription}`;
    if (context) {
      input += `\n\nBağlam:\n${context}`;
    }
    return super.execute(input);
  }

  async refactorCode(filePath: string, instructions: string): Promise<string> {
    return super.execute(
      `Aşağıdaki dosyayı yeniden düzenle:\n\nDosya: ${filePath}\nTalimat: ${instructions}`
    );
  }

  async fixBug(filePath: string, bugDescription: string): Promise<string> {
    return super.execute(
      `Aşağıdaki dosyadaki hatayı düzelt:\n\nDosya: ${filePath}\nHata: ${bugDescription}`
    );
  }
}
