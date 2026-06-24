import { Tool, ToolResult } from './index';
import { readFile } from 'fs/promises';

export class ExplainCodeTool implements Tool {
  name = 'explain_code';
  description = 'Kodu açıkla';

  definition = {
    name: 'explain_code',
    description: 'Verilen kodu detaylı şekilde açıklar: ne yaptığını, nasıl çalıştığını ve önemli noktaları belirtir.',
    parameters: {
      code: {
        type: 'string' as const,
        description: 'Açıklanacak kod',
        required: true
      },
      language: {
        type: 'string' as const,
        description: 'Kod dili (otomatik algılanabilir)',
      },
      filePath: {
        type: 'string' as const,
        description: 'Dosya yolu (dil algılama için)',
      },
      detailLevel: {
        type: 'string' as const,
        description: 'Açıklama detay seviyesi: brief, normal, detailed',
        default: 'normal'
      }
    },
    execute: async (params: Record<string, any>): Promise<ToolResult> => {
      return this.execute(params);
    }
  };

  async execute(params: Record<string, any>): Promise<ToolResult> {
    let { code, language, filePath, detailLevel = 'normal' } = params;

    if (!code && filePath) {
      try {
        code = await readFile(filePath, 'utf-8');
        if (!language) {
          language = this.detectLanguage(filePath);
        }
      } catch (error: any) {
        return {
          success: false,
          output: '',
          error: `Dosya okunamadı: ${error.message}`
        };
      }
    }

    if (!code) {
      return {
        success: false,
        output: '',
        error: 'Açıklanacak kod belirtilmedi'
      };
    }

    if (!language && filePath) {
      language = this.detectLanguage(filePath);
    }

    const analysis = this.analyzeCode(code, language, detailLevel);

    const explanation = [
      `📝 Kod Açıklaması${language ? ` (${language})` : ''}`,
      '',
      `📊 Genel Bakış:`,
      `  • Satır sayısı: ${analysis.lineCount}`,
      `  • Fonksiyon sayısı: ${analysis.functionCount}`,
      `  • Sınıf sayısı: ${analysis.classCount}`,
      `  • Import sayısı: ${analysis.importCount}`,
      '',
      `🔍 Kod Analizi:`,
      ...analysis.features.map(f => `  • ${f}`),
      ''
    ];

    if (detailLevel === 'detailed') {
      explanation.push(
        `📋 Detaylı Analiz:`,
        ...analysis.detailedAnalysis.map(a => `  ${a}`),
        ''
      );
    }

    if (analysis.potentialIssues.length > 0) {
      explanation.push(
        `⚠️ Olası Sorunlar:`,
        ...analysis.potentialIssues.map(i => `  • ${i}`),
        ''
      );
    }

    if (analysis.suggestions.length > 0) {
      explanation.push(
        `💡 Öneriler:`,
        ...analysis.suggestions.map(s => `  • ${s}`),
        ''
      );
    }

    return {
      success: true,
      output: explanation.join('\n'),
      metadata: {
        language,
        lineCount: analysis.lineCount,
        complexity: analysis.complexity,
        features: analysis.features,
        suggestions: analysis.suggestions
      }
    };
  }

  private analyzeCode(code: string, language?: string, detailLevel: string = 'normal') {
    const lines = code.split('\n');
    const lineCount = lines.length;

    const functionCount = (code.match(/\b(function|def|fn|func|const\s+\w+\s*=\s*(?:async\s+)?\(|const\s+\w+\s*=\s*(?:async\s+)?\w+\s*=>)/g) || []).length;
    const classCount = (code.match(/\b(class|interface|type|struct)\s+\w+/g) || []).length;
    const importCount = (code.match(/\b(import|require|from|include)\b/g) || []).length;
    const commentCount = (code.match(/(\/\/|#|\/\*|\*\/)/g) || []).length;

    const features: string[] = [];
    if (code.includes('async') || code.includes('await')) features.push('Asenkron işlemler kullanılıyor');
    if (code.includes('try') || code.includes('catch')) features.push('Hata yakalama mekanizması var');
    if (code.includes('class')) features.push('Sınıf tabanlı programlama');
    if (code.includes('interface') || code.includes('type')) features.push('Tip tanımları mevcut');
    if (code.includes('export')) features.push('Modül dışa aktarımı');
    if (code.includes('=>') || code.includes('function')) features.push('Fonksiyon tanımları');
    if (code.includes('[]') || code.includes('Array')) features.push('Dizi işlemleri');
    if (code.includes('{}') || code.includes('Map') || code.includes('Object')) features.push('Nesne/Map işlemleri');
    if (code.includes('Promise') || code.includes('async')) features.push('Promise tabanlı akış');

    const complexity = this.calculateComplexity(code);

    const potentialIssues: string[] = [];
    if (lineCount > 50) potentialIssues.push('Uzun fonksiyon/blok - bölünmeli');
    if (functionCount === 0 && lineCount > 20) potentialIssues.push('Fonksiyon yok - yeniden düzenlenmeli');
    if (commentCount === 0 && lineCount > 10) potentialIssues.push('Yorum eksikliği');
    if (code.includes('var ')) potentialIssues.push('var kullanımı - let/const tercih edilmeli');
    if (code.includes('==') || code.includes('!=')) potentialIssues.push('Lojik eşitlik - === tercih edilmeli');

    const suggestions: string[] = [];
    if (complexity > 10) suggestions.push('Karmaşıklık yüksek - basitleştirilmeli');
    if (functionCount === 0 && lineCount > 15) suggestions.push('Fonksiyonlara bölünmeli');
    if (commentCount === 0 && lineCount > 15) suggestions.push('Yorumlar eklenmeli');

    const detailedAnalysis: string[] = [];
    if (detailLevel === 'detailed') {
      if (code.includes('async')) detailedAnalysis.push('Asenkron yapıda çalışıyor');
      if (code.includes('try')) detailedAnalysis.push('Hata yönetimi mevcut');
      detailedAnalysis.push(`Karmaşıklık seviyesi: ${complexity > 10 ? 'Yüksek' : complexity > 5 ? 'Orta' : 'Düşük'}`);
    }

    return {
      lineCount,
      functionCount,
      classCount,
      importCount,
      commentCount,
      features,
      complexity,
      potentialIssues,
      suggestions,
      detailedAnalysis
    };
  }

  private calculateComplexity(code: string): number {
    let complexity = 1;
    const keywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||', '?'];
    
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b|\\${keyword}`, 'g');
      const matches = code.match(regex);
      if (matches) complexity += matches.length;
    }

    return complexity;
  }

  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'TypeScript',
      'tsx': 'TypeScript React',
      'js': 'JavaScript',
      'jsx': 'JavaScript React',
      'py': 'Python',
      'java': 'Java',
      'go': 'Go',
      'rs': 'Rust',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'rb': 'Ruby',
      'php': 'PHP',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'html': 'HTML',
      'css': 'CSS',
      'vue': 'Vue',
      'svelte': 'Svelte'
    };
    return langMap[ext || ''] || 'Bilinmeyen';
  }
}
