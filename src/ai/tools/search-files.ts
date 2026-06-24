import { Tool, ToolResult } from './index';
import { readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

export class SearchFilesTool implements Tool {
  name = 'search_files';
  description = 'Dosya adlarında ara';

  definition = {
    name: 'search_files',
    description: 'Dosya ve dizin adlarında arama yapar. Belirtilen kalıba uyan dosyaları listeler.',
    parameters: {
      pattern: {
        type: 'string' as const,
        description: 'Aranacak kalıp (dosya adında geçmeli)',
        required: true
      },
      path: {
        type: 'string' as const,
        description: 'Aranacak dizin (varsayılan: çalışma dizini)',
      },
      maxResults: {
        type: 'number' as const,
        description: 'Maksimum sonuç sayısı',
        default: 100
      }
    },
    execute: async (params: Record<string, any>): Promise<ToolResult> => {
      return this.execute(params);
    }
  };

  private findFiles(dir: string, pattern: string, maxResults: number, results: string[], rootDir: string): void {
    if (results.length >= maxResults) return;

    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (results.length >= maxResults) return;

        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') continue;
          if (entry.name.toLowerCase().includes(pattern.toLowerCase())) {
            results.push(relative(rootDir, fullPath) + '/');
          }
          this.findFiles(fullPath, pattern, maxResults, results, rootDir);
        } else if (entry.isFile()) {
          if (entry.name.toLowerCase().includes(pattern.toLowerCase())) {
            results.push(relative(rootDir, fullPath));
          }
        }
      }
    } catch {
      // Erişim hatası
    }
  }

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { pattern, path: searchPath = process.cwd(), maxResults = 100 } = params;

    if (!pattern) {
      return {
        success: false,
        output: '',
        error: 'Arama kalıbı belirtilmedi'
      };
    }

    try {
      const results: string[] = [];
      this.findFiles(searchPath, pattern, maxResults, results, searchPath);

      if (results.length === 0) {
        return {
          success: true,
          output: `"${pattern}" kalıbına uyan dosya bulunamadı`,
          metadata: { pattern, results: 0 }
        };
      }

      return {
        success: true,
        output: `📁 "${pattern}" için ${results.length} sonuç:\n${results.map(r => `  ${r}`).join('\n')}`,
        metadata: { pattern, results: results.length, files: results }
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: `Dosya arama hatası: ${error.message}`
      };
    }
  }
}
