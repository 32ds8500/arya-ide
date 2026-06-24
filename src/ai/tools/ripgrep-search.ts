import { Tool, ToolResult } from './index';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, extname } from 'path';

export class RipgrepSearchTool implements Tool {
  name = 'ripgrep_search';
  description = 'Dosya içeriklerinde regex ara';

  definition = {
    name: 'ripgrep_search',
    description: 'Dosya içeriklerinde regular expression kalıbıyla arama yapar. Tüm alt dizinleri tarar.',
    parameters: {
      pattern: {
        type: 'string' as const,
        description: 'Arama kalıbı (regex)',
        required: true
      },
      path: {
        type: 'string' as const,
        description: 'Aranacak dizin (varsayılan: çalışma dizini)',
      },
      include: {
        type: 'string' as const,
        description: 'Dahil edilecek dosya uzantısı (örn: .ts)',
      },
      maxResults: {
        type: 'number' as const,
        description: 'Maksimum sonuç sayısı',
        default: 50
      }
    },
    execute: async (params: Record<string, any>): Promise<ToolResult> => {
      return this.execute(params);
    }
  };

  private searchDir(dir: string, regex: RegExp, include: string | undefined, maxResults: number, results: Array<{ file: string; line: number; content: string }>, rootDir: string): void {
    if (results.length >= maxResults) return;

    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (results.length >= maxResults) return;

        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') continue;
          this.searchDir(fullPath, regex, include, maxResults, results, rootDir);
        } else if (entry.isFile()) {
          if (include && extname(entry.name) !== include) continue;
          if (entry.name.endsWith('.lock') || entry.name.endsWith('.map')) continue;

          try {
            const content = readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i++) {
              if (results.length >= maxResults) return;
              if (regex.test(lines[i])) {
                results.push({
                  file: relative(rootDir, fullPath),
                  line: i + 1,
                  content: lines[i].trim()
                });
              }
            }
          } catch {
            // Binary dosya veya okunamayan dosya
          }
        }
      }
    } catch {
      // Erişim hatası
    }
  }

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { pattern, path: searchPath = process.cwd(), include, maxResults = 50 } = params;

    if (!pattern) {
      return {
        success: false,
        output: '',
        error: 'Arama kalıbı belirtilmedi'
      };
    }

    try {
      const regex = new RegExp(pattern, 'gi');
      const results: Array<{ file: string; line: number; content: string }> = [];

      this.searchDir(searchPath, regex, include, maxResults, results, searchPath);

      if (results.length === 0) {
        return {
          success: true,
          output: `"${pattern}" kalıbı için sonuç bulunamadı`,
          metadata: { pattern, results: 0 }
        };
      }

      const output = results
        .map(r => `${r.file}:${r.line}: ${r.content}`)
        .join('\n');

      return {
        success: true,
        output: `🔍 "${pattern}" için ${results.length} sonuç:\n\n${output}`,
        metadata: { pattern, results: results.length, matches: results }
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: `Arama hatası: ${error.message}`
      };
    }
  }
}
