import { Tool, ToolResult } from './index';
import { writeFile, mkdir, stat } from 'fs/promises';
import { dirname } from 'path';

export class FileWriteTool implements Tool {
  name = 'file_write';
  description = 'Dosya oluştur veya güncelle';

  definition = {
    name: 'file_write',
    description: 'Belirtilen yola dosya yazar. Dosya yoksa oluşturur, varsa içeriğini değiştirir. Gerekli dizinleri otomatik oluşturur.',
    parameters: {
      filePath: {
        type: 'string' as const,
        description: 'Yazılacak dosyanın yolu',
        required: true
      },
      content: {
        type: 'string' as const,
        description: 'Dosyaya yazılacak içerik',
        required: true
      },
      createDirectories: {
        type: 'boolean' as const,
        description: 'Gerekirse üst dizinleri oluştur',
        default: true
      },
      append: {
        type: 'boolean' as const,
        description: 'Dosyanın sonuna ekle (append)',
        default: false
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
    const { filePath, content, createDirectories = true, append = false, encoding = 'utf-8' } = params;

    if (!filePath) {
      return {
        success: false,
        output: '',
        error: 'Dosya yolu belirtilmedi'
      };
    }

    if (content === undefined || content === null) {
      return {
        success: false,
        output: '',
        error: 'Yazılacak içerik belirtilmedi'
      };
    }

    try {
      if (createDirectories) {
        const dir = dirname(filePath);
        await mkdir(dir, { recursive: true });
      }

      let fileExists = false;
      let previousSize = 0;
      try {
        const fileStat = await stat(filePath);
        fileExists = true;
        previousSize = fileStat.size;
      } catch {}

      await writeFile(filePath, content, {
        encoding: encoding as BufferEncoding,
        flag: append ? 'a' : 'w'
      });

      const newStat = await stat(filePath);
      const action = fileExists ? (append ? 'Eklendi' : 'Güncellendi') : 'Oluşturuldu';

      return {
        success: true,
        output: `✅ ${action}: ${filePath}\nBoyut: ${newStat.size} byte`,
        metadata: {
          filePath,
          action: append ? 'append' : 'write',
          existed: fileExists,
          previousSize,
          newSize: newStat.size,
          lines: content.split('\n').length
        }
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: `Dosya yazma hatası: ${error.message}`
      };
    }
  }
}
