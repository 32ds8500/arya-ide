import { Tool, ToolResult } from './index';
import { readFile, writeFile } from 'fs/promises';

export class FileEditTool implements Tool {
  name = 'file_edit';
  description = 'Dosya içeriğinde değişiklik yap';

  definition = {
    name: 'file_edit',
    description: 'Dosya içinde belirli bir metni başka bir metinle değiştirir. Doğrudan düzenleme yapar, diff gösterir.',
    parameters: {
      filePath: {
        type: 'string' as const,
        description: 'Düzenlenecek dosyanın yolu',
        required: true
      },
      oldText: {
        type: 'string' as const,
        description: 'Değiştirilecek eski metin',
        required: true
      },
      newText: {
        type: 'string' as const,
        description: 'Yeni metin',
        required: true
      },
     replaceAll: {
        type: 'boolean' as const,
        description: 'Tüm eşleşmeleri değiştir (sadece ilkini değil)',
        default: false
      },
      caseSensitive: {
        type: 'boolean' as const,
        description: 'Büyük/küçük harf duyarlılığı',
        default: true
      },
      regex: {
        type: 'boolean' as const,
        description: 'oldText\'i regex olarak kullan',
        default: false
      }
    },
    execute: async (params: Record<string, any>): Promise<ToolResult> => {
      return this.execute(params);
    }
  };

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { filePath, oldText, newText, replaceAll = false, caseSensitive = true, regex = false } = params;

    if (!filePath) {
      return {
        success: false,
        output: '',
        error: 'Dosya yolu belirtilmedi'
      };
    }

    if (!oldText) {
      return {
        success: false,
        output: '',
        error: 'Değiştirilecek metin belirtilmedi'
      };
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      const originalContent = content;

      let newContent: string;
      let changeCount = 0;

      if (regex) {
        const flags = replaceAll ? 'g' : `${  caseSensitive ? '' : 'i'}`;
        const regexObj = new RegExp(oldText, flags);
        const matches = content.match(regexObj);
        changeCount = matches ? matches.length : 0;
        newContent = content.replace(regexObj, newText);
      } else {
        if (replaceAll) {
          const searchContent = caseSensitive ? content : content.toLowerCase();
          const searchText = caseSensitive ? oldText : oldText.toLowerCase();
          let lastIndex = 0;
          const parts: string[] = [];

          while (true) {
            const index = searchContent.indexOf(searchText, lastIndex);
            if (index === -1) break;
            
            parts.push(content.slice(lastIndex, index));
            parts.push(newText);
            lastIndex = index + oldText.length;
            changeCount++;
          }
          parts.push(content.slice(lastIndex));
          newContent = parts.join('');
        } else {
          const searchContent = caseSensitive ? content : content.toLowerCase();
          const searchText = caseSensitive ? oldText : oldText.toLowerCase();
          const index = searchContent.indexOf(searchText);
          
          if (index === -1) {
            return {
              success: false,
              output: '',
              error: `Aranan metin bulunamadı: "${oldText.substring(0, 50)}..."`
            };
          }

          newContent = content.slice(0, index) + newText + content.slice(index + oldText.length);
          changeCount = 1;
        }
      }

      if (changeCount === 0) {
        return {
          success: false,
          output: '',
          error: 'Eşleşme bulunamadı'
        };
      }

      await writeFile(filePath, newContent, 'utf-8');

      const oldLines = originalContent.split('\n');
      const newLines = newContent.split('\n');

      const diff: string[] = [];
      const maxLines = Math.max(oldLines.length, newLines.length);
      for (let i = 0; i < maxLines; i++) {
        if (oldLines[i] !== newLines[i]) {
          if (oldLines[i] !== undefined) diff.push(`- ${i + 1}: ${oldLines[i]}`);
          if (newLines[i] !== undefined) diff.push(`+ ${i + 1}: ${newLines[i]}`);
        }
      }

      return {
        success: true,
        output: `✅ Düzenlendi: ${filePath}\n${changeCount} eşleşme değiştirildi\n\nDiff:\n${diff.slice(0, 30).join('\n')}`,
        metadata: {
          filePath,
          changeCount,
          linesBefore: oldLines.length,
          linesAfter: newLines.length,
          diffPreview: diff.slice(0, 20)
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
        error: `Düzenleme hatası: ${error.message}`
      };
    }
  }
}
