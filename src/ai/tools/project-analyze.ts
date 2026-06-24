import { Tool, ToolResult } from './index';
import { readdir, readFile, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

export class ProjectAnalyzeTool implements Tool {
  name = 'project_analyze';
  description = 'Proje yapısını analiz et';

  definition = {
    name: 'project_analyze',
    description: 'Proje dizinini analiz eder: yapı, dil dağılımı, bağımlılıklar ve istatistikler.',
    parameters: {
      projectPath: {
        type: 'string' as const,
        description: 'Analiz edilecek proje dizini',
        required: true
      },
      includeStats: {
        type: 'boolean' as const,
        description: 'Dosya boyutu ve satır istatistikleri dahil',
        default: true
      },
      maxDepth: {
        type: 'number' as const,
        description: 'Maksimum dizin derinliği',
        default: 5
      }
    },
    execute: async (params: Record<string, any>): Promise<ToolResult> => {
      return this.execute(params);
    }
  };

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { projectPath, includeStats = true, maxDepth = 5 } = params;

    if (!projectPath) {
      return {
        success: false,
        output: '',
        error: 'Proje yolu belirtilmedi'
      };
    }

    try {
      await stat(projectPath);
    } catch {
      return {
        success: false,
        output: '',
        error: `Proje dizini bulunamadı: ${projectPath}`
      };
    }

    const stats = {
      totalFiles: 0,
      totalDirectories: 0,
      totalSize: 0,
      totalLines: 0,
      languages: new Map<string, { count: number; lines: number; size: number }>(),
      fileTypes: new Map<string, number>(),
      largestFiles: [] as Array<{ path: string; size: number; lines: number }>,
      structure: [] as string[]
    };

    const excludeDirs = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', 'venv', '.venv', 'coverage'];
    const excludeFiles = ['.DS_Store', 'Thumbs.db', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];

    const scan = async (currentPath: string, currentDepth: number, prefix: string = '') => {
      if (currentDepth > maxDepth) return;

      try {
        const entries = await readdir(currentPath, { withFileTypes: true });
        const sortedEntries = entries.sort((a, b) => {
          if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

        for (const entry of sortedEntries) {
          if (excludeDirs.includes(entry.name) || entry.name.startsWith('.')) continue;

          const fullPath = join(currentPath, entry.name);
          const relPath = fullPath.replace(projectPath, '').replace(/\\/g, '/');

          if (entry.isDirectory()) {
            stats.totalDirectories++;
            stats.structure.push(`${prefix}📁 ${entry.name}/`);
            await scan(fullPath, currentDepth + 1, `${prefix  }  `);
          } else {
            if (excludeFiles.includes(entry.name)) continue;

            const fileStat = await stat(fullPath);
            const ext = extname(entry.name).toLowerCase() || '.unknown';
            const lang = this.getLanguage(ext);

            stats.totalFiles++;
            stats.totalSize += fileStat.size;

            const langStats = stats.languages.get(lang) || { count: 0, lines: 0, size: 0 };
            langStats.count++;
            langStats.size += fileStat.size;

            let lines = 0;
            if (includeStats && this.isTextFile(ext)) {
              try {
                const content = await readFile(fullPath, 'utf-8');
                lines = content.split('\n').length;
                langStats.lines += lines;
                stats.totalLines += lines;
              } catch {}
            }

            stats.languages.set(lang, langStats);
            stats.fileTypes.set(ext, (stats.fileTypes.get(ext) || 0) + 1);

            stats.largestFiles.push({ path: relPath, size: fileStat.size, lines });
          }
        }
      } catch {}
    };

    await scan(projectPath, 0);

    stats.largestFiles.sort((a, b) => b.size - a.size);
    stats.largestFiles = stats.largestFiles.slice(0, 10);

    const langArray = Array.from(stats.languages.entries())
      .map(([lang, data]) => ({ lang, ...data }))
      .sort((a, b) => b.lines - a.lines);

    const output = [
      `📊 Proje Analizi: ${basename(projectPath)}`,
      '',
      '📈 Genel İstatistikler:',
      `  📄 Dosyalar: ${stats.totalFiles}`,
      `  📁 Dizinler: ${stats.totalDirectories}`,
      `  📝 Toplam Satır: ${stats.totalLines.toLocaleString()}`,
      `  💾 Toplam Boyut: ${this.formatSize(stats.totalSize)}`,
      '',
      '🌐 Dil Dağılımı:',
      ...langArray.slice(0, 10).map(l => 
        `  ${l.lang}: ${l.lines.toLocaleString()} satır (${l.count} dosya)`
      ),
      '',
      '📦 En Büyük Dosyalar:',
      ...stats.largestFiles.slice(0, 5).map(f => 
        `  ${f.path}: ${this.formatSize(f.size)}`
      ),
      '',
      '📂 Proje Yapısı:',
      ...stats.structure.slice(0, 50)
    ].join('\n');

    return {
      success: true,
      output,
      metadata: {
        projectPath,
        totalFiles: stats.totalFiles,
        totalDirectories: stats.totalDirectories,
        totalLines: stats.totalLines,
        totalSize: stats.totalSize,
        languages: langArray,
        largestFiles: stats.largestFiles
      }
    };
  }

  private getLanguage(ext: string): string {
    const langMap: Record<string, string> = {
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript React',
      '.js': 'JavaScript',
      '.jsx': 'JavaScript React',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go',
      '.rs': 'Rust',
      '.cpp': 'C++',
      '.c': 'C',
      '.h': 'C/C++ Header',
      '.cs': 'C#',
      '.rb': 'Ruby',
      '.php': 'PHP',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.scala': 'Scala',
      '.html': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.less': 'LESS',
      '.json': 'JSON',
      '.yaml': 'YAML',
      '.yml': 'YAML',
      '.xml': 'XML',
      '.md': 'Markdown',
      '.sql': 'SQL',
      '.sh': 'Shell',
      '.bash': 'Bash',
      '.vue': 'Vue',
      '.svelte': 'Svelte',
    };
    return langMap[ext] || ext.slice(1).toUpperCase() || 'Bilinmeyen';
  }

  private isTextFile(ext: string): boolean {
    const textExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.h', '.cs', '.rb', '.php', '.swift', '.kt', '.scala', '.html', '.css', '.scss', '.less', '.json', '.yaml', '.yml', '.xml', '.md', '.sql', '.sh', '.bash', '.vue', '.svelte', '.txt', '.env', '.gitignore', '.dockerignore'];
    return textExts.includes(ext);
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
  }
}
