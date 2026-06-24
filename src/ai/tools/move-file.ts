import { Tool, ToolResult } from './index';
import { rename, stat } from 'fs/promises';
import { dirname } from 'path';

export class MoveFileTool implements Tool {
  name = 'move_file';
  description = 'Dosya taşı veya yeniden adlandır';

  definition = {
    name: 'move_file',
    description: 'Bir dosyayı veya dizini yeni bir konuma taşır ya da yeniden adlandırır.',
    parameters: {
      source: {
        type: 'string' as const,
        description: 'Kaynak dosya yolu',
        required: true
      },
      destination: {
        type: 'string' as const,
        description: 'Hedef dosya yolu',
        required: true
      }
    },
    execute: async (params: Record<string, any>): Promise<ToolResult> => {
      return this.execute(params);
    }
  };

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { source, destination } = params;

    if (!source || !destination) {
      return {
        success: false,
        output: '',
        error: 'Kaynak ve hedef yolları belirtilmeli'
      };
    }

    try {
      await stat(source);

      await rename(source, destination);

      return {
        success: true,
        output: `✅ "${source}" → "${destination}" olarak taşındı`,
        metadata: { source, destination }
      };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return {
          success: false,
          output: '',
          error: `Kaynak dosya bulunamadı: ${source}`
        };
      }
      return {
        success: false,
        output: '',
        error: `Dosya taşıma hatası: ${error.message}`
      };
    }
  }
}
