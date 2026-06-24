import { Tool, ToolResult } from './index';
import { readdir, stat } from 'fs/promises';
import { join, extname, relative } from 'path';

export class DirectoryListTool implements Tool {
  name = 'directory_list';
  description = 'Dizin içeriğini listele';

  definition = {
    name: 'directory_list',
    description: 'Dizin içindeki dosya ve klasörleri listeler. Derinlik, filtre ve sıralama seçenekleri sunar.',
    parameters: {
      dirPath: {
        type: 'string' as const,
        description: 'Listelenecek dizin yolu',
        required: true
      },
      depth: {
        type: 'number' as const,
        description: 'Maksimum derinlik (0 = sadece üst düzey)',
        default: 1
      },
      includeFiles: {
        type: 'boolean' as const,
        description: 'Dosyaları dahil et',
        default: true
      },
      includeDirectories: {
        type: 'boolean' as const,
        description: 'Dizinleri dahil et',
        default: true
      },
      pattern: {
        type: 'string' as const,
        description: 'Dosya adı filtresi (glob pattern)',
      },
      exclude: {
        type: 'array' as const,
        description: 'Hariç tutulacak desenler',
        items: { type: 'string' }
      },
      sortBy: {
        type: 'string' as const,
        description: 'Sıralama: name, size, modified, type',
        default: 'name'
      }
    },
    execute: async (params: Record<string, any>): Promise<ToolResult> => {
      return this.execute(params);
    }
  };

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const {
      dirPath,
      depth = 1,
      includeFiles = true,
      includeDirectories = true,
      pattern,
      exclude = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__'],
      sortBy = 'name'
    } = params;

    if (!dirPath) {
      return {
        success: false,
        output: '',
        error: 'Dizin yolu belirtilmedi'
      };
    }

    try {
      await stat(dirPath);
    } catch {
      return {
        success: false,
        output: '',
        error: `Dizin bulunamadı: ${dirPath}`
      };
    }

    const results: Array<{ path: string; type: 'file' | 'directory'; size: number; modified: Date }> = [];

    const scan = async (currentPath: string, currentDepth: number) => {
      if (currentDepth > depth) return;

      try {
        const entries = await readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          if (exclude.some((ex: string) => entry.name === ex || entry.name.startsWith('.'))) {
            continue;
          }

          const fullPath = join(currentPath, entry.name);
          const isDir = entry.isDirectory();

          if (isDir && !includeDirectories) continue;
          if (!isDir && !includeFiles) continue;

          if (pattern && !this.matchPattern(entry.name, pattern)) continue;

          try {
            const fileStat = await stat(fullPath);
            results.push({
              path: relative(dirPath, fullPath),
              type: isDir ? 'directory' : 'file',
              size: fileStat.size,
              modified: fileStat.mtime
            });

            if (isDir && currentDepth < depth) {
              await scan(fullPath, currentDepth + 1);
            }
          } catch {}
        }
      } catch {}
    };

    await scan(dirPath, 1);

    results.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      
      switch (sortBy) {
        case 'size': return b.size - a.size;
        case 'modified': return b.modified.getTime() - a.modified.getTime();
        case 'type': return extname(a.path).localeCompare(extname(b.path));
        default: return a.path.localeCompare(b.path);
      }
    });

    const output = results.map(r => {
      const icon = r.type === 'directory' ? '📁' : '📄';
      const size = r.type === 'directory' ? '' : this.formatSize(r.size);
      return `${icon} ${r.path}${size ? ` (${size})` : ''}`;
    }).join('\n');

    return {
      success: true,
      output: `📂 ${dirPath}\n${results.length} öğe\n\n${output}`,
      metadata: {
        dirPath,
        totalItems: results.length,
        directories: results.filter(r => r.type === 'directory').length,
        files: results.filter(r => r.type === 'file').length,
        totalSize: results.reduce((sum, r) => sum + r.size, 0)
      }
    };
  }

  private matchPattern(filename: string, pattern: string): boolean {
    const regex = new RegExp(
      `^${  pattern.replace(/\*/g, '.*').replace(/\?/g, '.')  }$`,
      'i'
    );
    return regex.test(filename);
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }
}
