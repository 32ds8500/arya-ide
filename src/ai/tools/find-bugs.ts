import { Tool, ToolResult } from './index';
import { readFile } from 'fs/promises';

export class FindBugsTool implements Tool {
  name = 'find_bugs';
  description = 'Hataları bul';

  definition = {
    name: 'find_bugs',
    description: 'Kodda potansiyel hataları ve sorunları tarar: boş referans, tip hataları, asenkron sorunlar vb.',
    parameters: {
      code: {
        type: 'string' as const,
        description: 'Tarancak kod',
        required: true
      },
      language: {
        type: 'string' as const,
        description: 'Kod dili',
      },
      filePath: {
        type: 'string' as const,
        description: 'Dosya yolu',
      },
      severity: {
        type: 'string' as const,
        description: 'Ciddiyet seviyesi: all, high, medium, low',
        default: 'all'
      }
    },
    execute: async (params: Record<string, any>): Promise<ToolResult> => {
      return this.execute(params);
    }
  };

  async execute(params: Record<string, any>): Promise<ToolResult> {
    let { code, language, filePath, severity = 'all' } = params;

    if (!code && filePath) {
      try {
        code = await readFile(filePath, 'utf-8');
        if (!language) language = this.detectLanguage(filePath);
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
        error: 'Tarancak kod belirtilmedi'
      };
    }

    const bugs = this.scanBugs(code, language);

    const filteredBugs = severity === 'all' 
      ? bugs 
      : bugs.filter(b => b.severity === severity);

    const severityIcons: Record<string, string> = {
      high: '🔴',
      medium: '🟡',
      low: '🟢'
    };

    const output = [
      `🐛 Hata Tarama Sonuçları${language ? ` (${language})` : ''}`,
      '',
      `📊 Bulunan sorun: ${filteredBugs.length}`,
      `  🔴 Yüksek: ${bugs.filter(b => b.severity === 'high').length}`,
      `  🟡 Orta: ${bugs.filter(b => b.severity === 'medium').length}`,
      `  🟢 Düşük: ${bugs.filter(b => b.severity === 'low').length}`,
      ''
    ];

    if (filteredBugs.length === 0) {
      output.push('✅ Belirgin sorun bulunamadı');
    } else {
      for (const bug of filteredBugs.slice(0, 20)) {
        output.push(
          `${severityIcons[bug.severity]} ${bug.type}`,
          `  Konum: Satır ${bug.line}`,
          `  Açıklama: ${bug.description}`,
          `  Öneri: ${bug.suggestion}`,
          ''
        );
      }
    }

    return {
      success: true,
      output: output.join('\n'),
      metadata: {
        totalBugs: bugs.length,
        filteredBugs: filteredBugs.length,
        byCategory: {
          high: bugs.filter(b => b.severity === 'high').length,
          medium: bugs.filter(b => b.severity === 'medium').length,
          low: bugs.filter(b => b.severity === 'low').length
        },
        bugs: filteredBugs.slice(0, 50)
      }
    };
  }

  private scanBugs(code: string, language?: string): BugReport[] {
    const bugs: BugReport[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      if (line.includes('== null') || line.includes('!= null')) {
        bugs.push({
          type: 'Lojik Eşitlik Hatası',
          line: lineNum,
          description: 'null kontrolünde == veya != kullanılmış',
          suggestion: '=== null veya !== null kullanın',
          severity: 'medium',
          category: 'logic'
        });
      }

      if (line.includes('== undefined') || line.includes('!= undefined')) {
        bugs.push({
          type: 'Tanımsız Kontrol Hatası',
          line: lineNum,
          description: 'undefined kontrolünde == veya != kullanılmış',
          suggestion: '=== undefined veya !== undefined kullanın',
          severity: 'medium',
          category: 'logic'
        });
      }

      if (line.match(/\bvar\s+/)) {
        bugs.push({
          type: 'Eski Tarz Değişken Tanımı',
          line: lineNum,
          description: 'var kullanımı tarama kapsamı sorunlarına yol açabilir',
          suggestion: 'let veya const kullanın',
          severity: 'low',
          category: 'style'
        });
      }

      if (line.includes('document.write')) {
        bugs.push({
          type: 'Güvenlik Sorunu',
          line: lineNum,
          description: 'document.write kullanımı XSS açığı oluşturabilir',
          suggestion: 'DOM manipulation yöntemleri kullanın',
          severity: 'high',
          category: 'security'
        });
      }

      if (line.includes('eval(')) {
        bugs.push({
          type: 'Güvenlik Sorunu',
          line: lineNum,
          description: 'eval() kullanımı ciddi güvenlik açığı oluşturur',
          suggestion: 'eval() yerine güvenli alternatifler kullanın',
          severity: 'high',
          category: 'security'
        });
      }

      if (line.includes('innerHTML') && !line.includes('textContent')) {
        bugs.push({
          type: 'Güvenlik Sorunu',
          line: lineNum,
          description: 'innerHTML kullanımı XSS açığına neden olabilir',
          suggestion: 'textContent veya safe innerHTML kullanımı tercih edin',
          severity: 'medium',
          category: 'security'
        });
      }

      if (line.match(/\balert\s*\(/)) {
        bugs.push({
          type: 'Kullanıcı Deneyimi Sorunu',
          line: lineNum,
          description: 'alert() kullanımı modern uygulamalarda önerilmez',
          suggestion: 'Toast notification veya modal kullanın',
          severity: 'low',
          category: 'ux'
        });
      }

      if (line.match(/catch\s*\(\s*\w*\s*\)\s*\{\s*\}/)) {
        bugs.push({
          type: 'Boş Hata Yakalama',
          line: lineNum,
          description: 'Boş catch bloğu hataları yutuyor',
          suggestion: 'Hata loglama veya yeniden fırlatma ekleyin',
          severity: 'medium',
          category: 'error-handling'
        });
      }

      if (line.includes('console.log') && !line.includes('//')) {
        bugs.push({
          type: 'Debug Kalıntısı',
          line: lineNum,
          description: 'console.log üretim kodunda kalmış',
          suggestion: 'Debug loglarını kaldırın veya debug seviyesine alın',
          severity: 'low',
          category: 'cleanup'
        });
      }

      if (line.match(/https?:\/\/[^\s'"]+/) && !line.includes('const') && !line.includes('let')) {
        bugs.push({
          type: 'Hardcoded URL',
          line: lineNum,
          description: 'URL doğrudan kodda tanımlanmış',
          suggestion: 'Environment değişkenleri veya sabitler kullanın',
          severity: 'low',
          category: 'maintainability'
        });
      }

      if (line.match(/\bnew Promise\s*\(\s*\(\s*resolve\s*,\s*reject\s*\)\s*=>/) && lines.slice(i, i + 5).some(l => l.includes('await'))) {
        bugs.push({
          type: 'Promise/Await Karışımı',
          line: lineNum,
          description: 'Promise içinde await kullanımı',
          suggestion: 'async fonksiyon kullanın veya promise zinciri oluşturun',
          severity: 'medium',
          category: 'async'
        });
      }

      if (line.includes('Math.random()') && (code.includes('token') || code.includes('key') || code.includes('password'))) {
        bugs.push({
          type: 'Güvenlik Sorunu',
          line: lineNum,
          description: 'Math.random() kriptografik olarak güvenli değil',
          suggestion: 'crypto.randomUUID() veya crypto.getRandomValues() kullanın',
          severity: 'high',
          category: 'security'
        });
      }

      if (line.match(/=\s*\[\s*\]/) && !line.includes('const') && !line.includes('let')) {
        bugs.push({
          type: 'Potansiyel Hafıza Sızıntısı',
          line: lineNum,
          description: 'Dizi tanımlaması without const/let',
          suggestion: 'const veya let ile tanımlayın',
          severity: 'low',
          category: 'memory'
        });
      }
    }

    return bugs;
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
      'cs': 'C#'
    };
    return langMap[ext || ''] || 'Bilinmeyen';
  }
}

interface BugReport {
  type: string;
  line: number;
  description: string;
  suggestion: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
}
