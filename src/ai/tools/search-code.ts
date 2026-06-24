import { Tool, ToolResult } from './index';
import { readdir, readFile, stat } from 'fs/promises';
import { join, extname, relative } from 'path';

export class SearchCodeTool implements Tool {
  name = 'search_code';
  description = 'Kodda ara';

  definition = {
    name: 'search_code',
    description: 'Proje içinde kod araması yapar. Regex desteği, dosya filtresi ve sonuç sınırlama sunar.',
    parameters: {
      query: {
        type: 'string' as const,
        description: 'Arama sorgusu (regex destekli)',
        required: true
      },
      directory: {
        type: 'string' as const,
        description: 'Aranacak dizin',
        required: true
      },
      filePattern: {
        type: 'string' as const,
        description: 'Dosya filtresi (glob pattern)',
      },
      excludePattern: {
        type: 'string' as const,
        description: 'Hariç tutulacak desenler',
      },
      useRegex: {
        type: 'boolean' as const,
        description: 'Regex olarak ara',
        default: false
      },
      caseSensitive: {
        type: 'boolean' as const,
        description: 'Büyük/küçük harf duyarlılığı',
        default: false
      },
      wholeWord: {
        type: 'boolean' as const,
        description: 'Tam kelime eşleşmesi',
        default: false
      },
      maxResults: {
        type: 'number' as const,
        description: 'Maksimum sonuç sayısı',
        default: 100
      },
      contextLines: {
        type: 'number' as const,
        description: 'Eşleşme etrafında gösterilecek satır sayısı',
        default: 1
      }
    },
    execute: async (params: Record<string, any>): Promise<ToolResult> => {
      return this.execute(params);
    }
  };

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const {
      query,
      directory,
      filePattern,
      excludePattern = 'node_modules|.git|dist|build|__pycache__',
      useRegex = false,
      caseSensitive = false,
      wholeWord = false,
      maxResults = 100,
      contextLines = 1
    } = params;

    if (!query || !directory) {
      return {
        success: false,
        output: '',
        error: 'Sorgo ve dizin belirtilmedi'
      };
    }

    try {
      await stat(directory);
    } catch {
      return {
        success: false,
        output: '',
        error: `Dizin bulunamadı: ${directory}`
      };
    }

    let regex: RegExp;
    try {
      let pattern = query;
      if (!useRegex) {
        pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      if (wholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
      const flags = caseSensitive ? 'g' : 'gi';
      regex = new RegExp(pattern, flags);
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: `Geçersiz regex: ${error.message}`
      };
    }

    const excludeRegex = excludePattern ? new RegExp(excludePattern) : null;
    const fileRegex = filePattern ? new RegExp(filePattern.replace(/\*/g, '.*').replace(/\?/g, '.')) : null;

    const results: SearchResult[] = [];
    const scannedFiles = new Set<string>();

    const scan = async (currentPath: string) => {
      if (results.length >= maxResults) return;

      try {
        const entries = await readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          if (results.length >= maxResults) break;

          const fullPath = join(currentPath, entry.name);

          if (entry.isDirectory()) {
            if (excludeRegex && excludeRegex.test(entry.name)) continue;
            if (entry.name.startsWith('.')) continue;
            await scan(fullPath);
          } else {
            if (excludeRegex && excludeRegex.test(entry.name)) continue;

            const ext = extname(entry.name);
            if (fileRegex && !fileRegex.test(entry.name) && !fileRegex.test(ext)) continue;

            const textExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.cs', '.rb', '.php', '.html', '.css', '.json', '.yaml', '.yml', '.md', '.sql', '.sh', '.vue', '.svelte'];
            if (!textExts.includes(ext)) continue;

            try {
              const content = await readFile(fullPath, 'utf-8');
              const lines = content.split('\n');
              const relPath = relative(directory, fullPath);

              let lineIndex = 0;
              while (lineIndex < lines.length && results.length < maxResults) {
                regex.lastIndex = 0;
                const match = regex.exec(lines[lineIndex]);
                if (match) {
                  const startContext = Math.max(0, lineIndex - contextLines);
                  const endContext = Math.min(lines.length - 1, lineIndex + contextLines);
                  const context = lines.slice(startContext, endContext + 1);

                  results.push({
                    file: relPath,
                    line: lineIndex + 1,
                    column: match.index + 1,
                    match: match[0],
                    context: context.map((l, i) => ({
                      line: startContext + i + 1,
                      content: l,
                      isMatch: startContext + i === lineIndex
                    }))
                  });
                }
                lineIndex++;
              }
            } catch {}
          }
        }
      } catch {}
    };

    await scan(directory);

    const groupedByFile = new Map<string, SearchResult[]>();
    for (const result of results) {
      const fileResults = groupedByFile.get(result.file) || [];
      fileResults.push(result);
      groupedByFile.set(result.file, fileResults);
    }

    const output: string[] = [
      `🔍 Kod Arama: "${query}"`,
      `📁 Dizin: ${directory}`,
      `📊 Sonuç: ${results.length} eşleşme, ${groupedByFile.size} dosya`,
      ''
    ];

    for (const [file, fileResults] of groupedByFile) {
      output.push(`📄 ${file}`);
      for (const result of fileResults.slice(0, 5)) {
        output.push(`  Satır ${result.line}:${result.column}: ${result.match}`);
        for (const ctx of result.context) {
          const marker = ctx.isMatch ? '>' : ' ';
          output.push(`  ${marker} ${ctx.line}: ${ctx.content}`);
        }
        output.push('');
      }
      if (fileResults.length > 5) {
        output.push(`  ... ve ${fileResults.length - 5} eşleşme daha`);
        output.push('');
      }
    }

    return {
      success: true,
      output: output.join('\n'),
      metadata: {
        query,
        directory,
        totalMatches: results.length,
        totalFiles: groupedByFile.size,
        results: results.slice(0, 50)
      }
    };
  }
}

interface SearchResult {
  file: string;
  line: number;
  column: number;
  match: string;
  context: Array<{
    line: number;
    content: string;
    isMatch: boolean;
  }>;
}
