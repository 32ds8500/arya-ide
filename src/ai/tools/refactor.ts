import { Tool, ToolResult } from './index';
import { readFile, writeFile } from 'fs/promises';

export class RefactorTool implements Tool {
  name = 'refactor';
  description = 'Kod yeniden düzenle';

  definition = {
    name: 'refactor',
    description: 'Kod yeniden düzenleme yapar: fonksiyon çıkarma, değişken yeniden adlandırma, import düzenleme vb.',
    parameters: {
      filePath: {
        type: 'string' as const,
        description: 'Yeniden düzenlenecek dosya',
        required: true
      },
      operation: {
        type: 'string' as const,
        description: 'İşlem türü: rename, extract, inline, move, organize-imports',
        required: true
      },
      target: {
        type: 'string' as const,
        description: 'Hedef (yeniden adlandırma için eski isim, çıkarma için kod bloğu)',
        required: true
      },
      replacement: {
        type: 'string' as const,
        description: 'Yeni değer (yeniden adlandırma için yeni isim, çıkarma için fonksiyon adı)',
      },
      options: {
        type: 'object' as const,
        description: 'İşlem seçenekleri',
        properties: {
          newName: { type: 'string', description: 'Yeni isim' },
          newType: { type: 'string', description: 'Yeni tür' },
          visibility: { type: 'string', description: 'Görünürlük' }
        }
      }
    },
    execute: async (params: Record<string, any>): Promise<ToolResult> => {
      return this.execute(params);
    }
  };

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { filePath, operation, target, replacement, options = {} } = params;

    if (!filePath || !operation || !target) {
      return {
        success: false,
        output: '',
        error: 'Gerekli parametreler eksik'
      };
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      const originalContent = content;

      let result: string;
      switch (operation) {
        case 'rename':
          result = this.renameVariable(content, target, replacement, options);
          break;
        case 'extract':
          result = this.extractFunction(content, target, replacement, options);
          break;
        case 'inline':
          result = this.inlineFunction(content, target);
          break;
        case 'organize-imports':
          result = this.organizeImports(content);
          break;
        default:
          return {
            success: false,
            output: '',
            error: `Bilinmeyen işlem: ${operation}. Mevcut işlemler: rename, extract, inline, organize-imports`
          };
      }

      if (result === originalContent) {
        return {
          success: false,
          output: '',
          error: 'Değişiklik yapılamadı'
        };
      }

      await writeFile(filePath, result, 'utf-8');

      const changes = this.countChanges(originalContent, result);

      return {
        success: true,
        output: `✅ Yeniden düzenleme tamamlandı: ${filePath}\nİşlem: ${operation}\nDeğişiklik: ${changes} satır`,
        metadata: {
          filePath,
          operation,
          changes,
          contentLength: result.length
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
        error: `Yeniden düzenleme hatası: ${error.message}`
      };
    }
  }

  private renameVariable(content: string, oldName: string, newName: string, options: any): string {
    if (!newName) return content;

    const regex = new RegExp(`\\b${this.escapeRegex(oldName)}\\b`, 'g');
    return content.replace(regex, newName);
  }

  private extractFunction(content: string, targetCode: string, functionName: string, options: any): string {
    if (!functionName) functionName = 'extractedFunction';

    const lines = content.split('\n');
    const functionLines = targetCode.split('\n');
    
    let startIndex = -1;
    for (let i = 0; i <= lines.length - functionLines.length; i++) {
      let match = true;
      for (let j = 0; j < functionLines.length; j++) {
        if (lines[i + j].trim() !== functionLines[j].trim()) {
          match = false;
          break;
        }
      }
      if (match) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) return content;

    const indent = lines[startIndex].match(/^(\s*)/)?.[1] || '';
    const parameters = this.detectParameters(targetCode);
    
    const extractedFunction = [
      `${indent}function ${functionName}(${parameters.join(', ')}) {`,
      ...functionLines.map(l => `${indent}  ${l.trim()}`),
      `${indent}}`,
      ''
    ].join('\n');

    const callLine = `${indent}${functionName}(${parameters.join(', ')});`;
    
    lines.splice(startIndex, functionLines.length, callLine);

    const lastFunctionIndex = lines.findIndex(l => l.includes('function ') || l.includes('const ') || l.includes('export '));
    if (lastFunctionIndex > 0) {
      lines.splice(lastFunctionIndex, 0, extractedFunction);
    } else {
      lines.unshift(extractedFunction);
    }

    return lines.join('\n');
  }

  private inlineFunction(content: string, functionName: string): string {
    const regex = new RegExp(`function\\s+${this.escapeRegex(functionName)}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}`, 'g');
    const match = regex.exec(content);
    if (!match) return content;

    const functionBody = match[1];
    const callRegex = new RegExp(`${this.escapeRegex(functionName)}\\s*\\([^)]*\\)`, 'g');
    
    return content
      .replace(regex, '')
      .replace(callRegex, functionBody.trim());
  }

  private organizeImports(content: string): string {
    const lines = content.split('\n');
    const imports: string[] = [];
    const nonImports: string[] = [];

    for (const line of lines) {
      if (line.trim().startsWith('import ') || line.trim().startsWith('import{')) {
        imports.push(line);
      } else {
        nonImports.push(line);
      }
    }

    imports.sort((a, b) => {
      const aFrom = a.match(/from\s+['"]([^'"]+)['"]/)?.[1] || '';
      const bFrom = b.match(/from\s+['"]([^'"]+)['"]/)?.[1] || '';
      
      const aIsExternal = !aFrom.startsWith('.') && !aFrom.startsWith('/');
      const bIsExternal = !bFrom.startsWith('.') && !bFrom.startsWith('/');
      
      if (aIsExternal !== bIsExternal) return aIsExternal ? -1 : 1;
      return aFrom.localeCompare(bFrom);
    });

    return [...imports, '', ...nonImports].join('\n');
  }

  private detectParameters(code: string): string[] {
    const params: string[] = [];
    const varRegex = /(?:const|let|var)\s+(\w+)/g;
    let match;

    while ((match = varRegex.exec(code)) !== null) {
      if (!params.includes(match[1]) && !['const', 'let', 'var'].includes(match[1])) {
        params.push(match[1]);
      }
    }

    return params.slice(0, 5);
  }

  private countChanges(original: string, modified: string): number {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    let changes = 0;

    const maxLines = Math.max(originalLines.length, modifiedLines.length);
    for (let i = 0; i < maxLines; i++) {
      if (originalLines[i] !== modifiedLines[i]) changes++;
    }

    return changes;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
