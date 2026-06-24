import { BaseAgent } from './base-agent';
import { AgentConfig, ReviewFinding } from './types';

const REVIEWER_SYSTEM_PROMPT = `Sen bir Reviewer Agent'sın. Kod inceleme, güvenlik analizi ve kalite kontrol sorumluluğun var.

Sorumlulukların:
- Kod kalitesini değerlendir
- Güvenlik açıklarını tespit et
- Best practice ihlallerini bul
- Performans sorunlarını belirt
- İyileştirme önerileri sun

İnceleme kriterleri:
1. Kod kalitesi ve okunabilirliği
2. Güvenlik (XSS, SQL Injection, vb.)
3. Performans
4. Bakım yapılabilirliği
5. Test edilebilirlik
6. Tip güvenliği

Her bulgu için şu formatı kullan:
- Ciddiyet: critical/high/medium/low/info
- Kategori: güvenlik/performans/kalite/yapı
- Dosya: dosya yolu
- Satır: satır numarası
- Mesaj: açıklama
- Öneri: düzeltme önerisi

Her zaman Türkçe yanıt ver.`;

export class ReviewerAgent extends BaseAgent {
  constructor(config: Partial<AgentConfig> = {}) {
    super({
      id: config.id || `reviewer_${Date.now()}`,
      type: 'reviewer',
      name: config.name || 'Reviewer Agent',
      systemPrompt: REVIEWER_SYSTEM_PROMPT,
      tools: config.tools || ['file_read', 'ripgrep_search', 'search_files'],
      maxSteps: config.maxSteps || 10,
      model: config.model || 'llama3.2',
      provider: config.provider || 'ollama',
      ...config
    });
  }

  getSystemPrompt(): string {
    return REVIEWER_SYSTEM_PROMPT;
  }

  async reviewCode(codeOrPath: string): Promise<string> {
    return super.execute(`Aşağıdaki kodu veya dosyayı incele:\n\n${codeOrPath}`);
  }

  async securityReview(filePath: string): Promise<string> {
    return super.execute(`Aşağıdaki dosyayı güvenlik açısından incele:\n\nDosya: ${filePath}`);
  }

  async architectureReview(directoryPath: string): Promise<string> {
    return super.execute(`Aşağıdaki dizinin mimarisini incele:\n\nDizin: ${directoryPath}`);
  }

  parseFindings(reviewResult: string): ReviewFinding[] {
    const findings: ReviewFinding[] = [];
    const lines = reviewResult.split('\n');

    for (const line of lines) {
      const severityMatch = line.match(/(?:ciddiyet|severity):\s*(critical|high|medium|low|info)/i);
      const categoryMatch = line.match(/(?:kategori|category):\s*(\w+)/i);
      const fileMatch = line.match(/(?:dosya|file):\s*(.+)/i);
      const lineMatch = line.match(/(?:satır|line):\s*(\d+)/i);
      const messageMatch = line.match(/(?:mesaj|message):\s*(.+)/i);
      const suggestionMatch = line.match(/(?:öneri|suggestion):\s*(.+)/i);

      if (severityMatch || messageMatch) {
        findings.push({
          severity: (severityMatch?.[1] as any) || 'info',
          category: categoryMatch?.[1] || 'genel',
          file: fileMatch?.[1]?.trim(),
          line: lineMatch ? parseInt(lineMatch[1]) : undefined,
          message: messageMatch?.[1]?.trim() || line.trim(),
          suggestion: suggestionMatch?.[1]?.trim()
        });
      }
    }

    return findings;
  }
}
