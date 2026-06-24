import { Tool, ToolResult } from './index';

export class WebFetchTool implements Tool {
  name = 'web_fetch';
  description = 'Web sayfası içeriğini getir';

  definition = {
    name: 'web_fetch',
    description: 'Belirtilen URL\'den içerik getirir. Metin veya HTML formatında döndürür.',
    parameters: {
      url: {
        type: 'string' as const,
        description: 'Getirilecek URL',
        required: true
      },
      format: {
        type: 'string' as const,
        description: 'Çıkış formatı: text veya html',
        default: 'text'
      },
      timeout: {
        type: 'number' as const,
        description: 'Zaman aşımı (milisaniye)',
        default: 15000
      }
    },
    execute: async (params: Record<string, any>): Promise<ToolResult> => {
      return this.execute(params);
    }
  };

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { url, format = 'text', timeout = 15000 } = params;

    if (!url) {
      return {
        success: false,
        output: '',
        error: 'URL belirtilmedi'
      };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'AryaIDE/1.0',
          'Accept': format === 'html' ? 'text/html' : 'text/plain'
        }
      });

      clearTimeout(timer);

      if (!response.ok) {
        return {
          success: false,
          output: '',
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const content = await response.text();
      const truncated = content.length > 100000
        ? content.substring(0, 100000) + '\n\n... (içerik kısaltıldı)'
        : content;

      return {
        success: true,
        output: `🌐 ${url}\n${truncated}`,
        metadata: { url, format, status: response.status, size: content.length }
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          output: '',
          error: `Zaman aşımı (${timeout}ms) - ${url}`
        };
      }
      return {
        success: false,
        output: '',
        error: `Sayfa getirme hatası: ${error.message}`
      };
    }
  }
}
