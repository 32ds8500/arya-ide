import { Tool, ToolResult } from './index';
import { readFile, stat } from 'fs/promises';
import { extname } from 'path';

export class FileReadTool implements Tool {
  name = 'file_read';
  description = 'Dosya içeriğini oku';

  definition = {
    name: 'file_read',
    description: 'Belirtilen dosyanın içeriğini okur. Metin dosyaları için tam içerik, büyük dosyalar için ilk N satırı döndürür.',
    parameters: {
      filePath: {
        type: 'string' as const,
        description: 'Okunacak dosyanın yolu',
        required: true
      },
      startLine: {
        type: 'number' as const,
        description: 'Okumaya başlanacak satır numarası (1\'den başlar)',
        default: 1
      },
      endLine: {
        type: 'number' as const,
        description: 'Okumanın durdurulacağı satır numarası',
      },
      encoding: {
        type: 'string' as const,
        description: 'Dosya karakter kodlaması',
        default: 'utf-8'
      }
    },
    execute: async (params: Record<string, any>): Promise<ToolResult> => {
      return this.execute(params);
    }
  };

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { filePath, startLine = 1, endLine, encoding = 'utf-8' } = params;

    if (!filePath) {
      return {
        success: false,
        output: '',
        error: 'Dosya yolu belirtilmedi'
      };
    }

    try {
      const fileStat = await stat(filePath);
      if (fileStat.isDirectory()) {
        return {
          success: false,
          output: '',
          error: `"${filePath}" bir dizin, dosya değil`
        };
      }

      const maxSize = 10 * 1024 * 1024;
      if (fileStat.size > maxSize) {
        return {
          success: false,
          output: '',
          error: `Dosya çok büyük (${Math.round(fileStat.size / 1024 / 1024)}MB). Maksimum boyut: 10MB`
        };
      }

      const content = await readFile(filePath, encoding as BufferEncoding);
      const lines = content.split('\n');
      const totalLines = lines.length;

      const actualStartLine = Math.max(1, startLine);
      const actualEndLine = endLine ? Math.min(endLine, totalLines) : totalLines;

      const selectedLines = lines.slice(actualStartLine - 1, actualEndLine);
      const numberedContent = selectedLines
        .map((line, i) => `${actualStartLine + i}: ${line}`)
        .join('\n');

      const ext = extname(filePath);
      const lineInfo = endLine 
        ? `Satır ${actualStartLine}-${actualEndLine} / ${totalLines}`
        : `Toplam ${totalLines} satır`;

      return {
        success: true,
        output: `📄 ${filePath}\n${lineInfo}\n\n${numberedContent}`,
        metadata: {
          filePath,
          totalLines,
          startLine: actualStartLine,
          endLine: actualEndLine,
          size: fileStat.size,
          extension: ext
        }
      };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return {
          success: false,
          output: '',
          error: `Dosya bulunamadı: ${filePath}`
        };
      }
      return {
        success: false,
        output: '',
        error: `Dosya okuma hatası: ${error.message}`
      };
    }
  }
}
