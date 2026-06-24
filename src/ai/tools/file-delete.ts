import { Tool, ToolResult } from './index';
import { unlink, stat, readdir, rmdir } from 'fs/promises';
import { join } from 'path';

export class FileDeleteTool implements Tool {
  name = 'file_delete';
  description = 'Dosya veya dizin sil';

  definition = {
    name: 'file_delete',
    description: 'Belirtilen dosyayı veya dizini siler. Boş dizinleri siler, dolu dizinler için recursive seçeneği gerekir.',
    parameters: {
      path: {
        type: 'string' as const,
        description: 'Silinecek dosya veya dizin yolu',
        required: true
      },
      recursive: {
        type: 'boolean' as const,
        description: 'Dizin içindekileri de sil',
        default: false
      },
      force: {
        type: 'boolean' as const,
        description: 'Hata olmadan silmeye devam et',
        default: false
      }
    },
    execute: async (params: Record<string, any>): Promise<ToolResult> => {
      return this.execute(params);
    }
  };

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { path: targetPath, recursive = false, force = false } = params;

    if (!targetPath) {
      return {
        success: false,
        output: '',
        error: 'Yol belirtilmedi'
      };
    }

    try {
      const fileStat = await stat(targetPath);
      const isDirectory = fileStat.isDirectory();

      if (isDirectory && recursive) {
        await this.removeDirectory(targetPath);
      } else if (isDirectory && !recursive) {
        const files = await readdir(targetPath);
        if (files.length > 0 && !force) {
          return {
            success: false,
            output: '',
            error: `Dizin boş değil (${files.length} öğe). recursive=true kullanın`
          };
        }
        await rmdir(targetPath);
      } else {
        await unlink(targetPath);
      }

      const type = isDirectory ? 'Dizin' : 'Dosya';
      return {
        success: true,
        output: `🗑️ ${type} silindi: ${targetPath}`,
        metadata: {
          path: targetPath,
          type: isDirectory ? 'directory' : 'file',
          recursive
        }
      };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return {
          success: false,
          output: '',
          error: `Bulunamadı: ${targetPath}`
        };
      }
      if (error.code === 'ENOTEMPTY' && !force) {
        return {
          success: false,
          output: '',
          error: `Dizin boş değil. recursive=true veya force=true kullanın`
        };
      }
      return {
        success: false,
        output: '',
        error: `Silme hatası: ${error.message}`
      };
    }
  }

  private async removeDirectory(dirPath: string): Promise<void> {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await this.removeDirectory(fullPath);
      } else {
        await unlink(fullPath);
      }
    }
    
    await rmdir(dirPath);
  }
}
