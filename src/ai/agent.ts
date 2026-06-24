import { Message } from './providers/base';
import { createProvider, ProviderName } from './providers';
import { getTool, listTools, ToolResult } from './tools';


export interface AgentStep {
  id: number;
  type: 'thought' | 'action' | 'observation' | 'response';
  content: string;
  tool?: string;
  toolInput?: Record<string, any>;
  toolOutput?: ToolResult;
  timestamp: Date;
}

export interface AgentResult {
  response: string;
  steps: AgentStep[];
  totalSteps: number;
  toolsUsed: string[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AgentOptions {
  provider?: ProviderName;
  model?: string;
  systemPrompt?: string;
  maxSteps?: number;
  temperature?: number;
  maxTokens?: number;
  tools?: string[];
  onStep?: (step: AgentStep) => void;
}

const DEFAULT_SYSTEM_PROMPT = `Sen Arya IDE'nin yapay zeka asistanısın. Kullanıcılara kod yazma, hata ayıklama, yeniden düzenleme ve proje analizinde yardımcı oluyorsun.

Görevleri yerine getirmek için araçları kullanabilirsin. Her adımda düşün, harekete geç ve sonucu gözlemle.

Önemli kurallar:
- Her zaman Türkçe konuş
- Güvenli ve doğru kod üret
- Hata yaptığında düzelt
- Kullanıcının ihtiyacını anla ve en iyi çözümü öner`;

export async function agent(
  message: string,
  options: AgentOptions = {}
): Promise<AgentResult> {
  const {
    provider = 'ollama',
    model,
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    maxSteps = 10,
    temperature = 0.7,
    maxTokens = 4096,
    tools: toolFilter,
    onStep
  } = options;

  const aiProvider = createProvider(provider);
  const targetModel = model || getDefaultModel(provider);

  const availableTools = toolFilter
    ? listTools().filter(t => toolFilter.includes(t.name))
    : listTools();

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message }
  ];

  const steps: AgentStep[] = [];
  const toolsUsed = new Set<string>();
  let stepCount = 0;

  const toolDescriptions = availableTools.map(t => {
    const params = Object.entries(t.definition.parameters)
      .map(([name, param]) => `    ${name}: ${param.description}${param.required ? ' (gerekli)' : ''}`)
      .join('\n');
    return `${t.name}: ${t.description}\n  Parametreler:\n${params}`;
  }).join('\n\n');

  const agentPrompt = `
Mevcut araçlar:
${toolDescriptions}

Bir görevi yerine getirmek için şu formatta düşün ve hareket et:
DÜŞÜNCE: <gözlem ve plan>
ARAÇ: <kullanılacak araç adı>
ARAÇ_GİRDİSİ: <JSON formatında girdi parametreleri>
 SONRAKİ ADIM: <bir sonraki adımın açıklaması>

Görev tamamlandığında:
DÜŞÜNCE: Görev tamamlandı
YANIT: <kullanıcıya yanıtı>

Her adımda SADECE bir araç kullan. Araç sonuçlarını almadan bir sonraki adıma geçme.`;

  messages.push({ role: 'system', content: agentPrompt });

  while (stepCount < maxSteps) {
    stepCount++;

    const response = await aiProvider.chat(messages, targetModel, {
      temperature,
      maxTokens
    });

    const content = response.content;

    const thoughtMatch = content.match(/DÜŞÜNCE:\s*(.+?)(?=ARAÇ:|YANIT:|$)/s);
    const actionMatch = content.match(/ARAÇ:\s*(.+?)(?=\n|$)/s);
    const inputMatch = content.match(/ARAÇ_GİRDİSİ:\s*(.+?)(?=SONRAKİ ADIM:|DÜŞÜNCE:|YANIT:|$)/s);
    const responseMatch = content.match(/YANIT:\s*(.+)$/s);

    if (thoughtMatch) {
      const thoughtStep: AgentStep = {
        id: stepCount,
        type: 'thought',
        content: thoughtMatch[1].trim(),
        timestamp: new Date()
      };
      steps.push(thoughtStep);
      onStep?.(thoughtStep);
    }

    if (responseMatch) {
      const responseStep: AgentStep = {
        id: stepCount,
        type: 'response',
        content: responseMatch[1].trim(),
        timestamp: new Date()
      };
      steps.push(responseStep);
      onStep?.(responseStep);

      return {
        response: responseMatch[1].trim(),
        steps,
        totalSteps: stepCount,
        toolsUsed: Array.from(toolsUsed),
        usage: response.usage
      };
    }

    if (actionMatch && inputMatch) {
      const toolName = actionMatch[1].trim();
      let toolInput: Record<string, any>;

      try {
        toolInput = JSON.parse(inputMatch[1].trim());
      } catch {
        toolInput = {};
      }

      const actionStep: AgentStep = {
        id: stepCount,
        type: 'action',
        content: `Araç çağrısı: ${toolName}`,
        tool: toolName,
        toolInput,
        timestamp: new Date()
      };
      steps.push(actionStep);
      onStep?.(actionStep);

      const tool = getTool(toolName);
      let toolOutput: ToolResult;

      if (tool) {
        toolsUsed.add(toolName);
        try {
          toolOutput = await tool.execute(toolInput);
        } catch (error: any) {
          toolOutput = {
            success: false,
            output: '',
            error: `Araç hatası: ${error.message}`
          };
        }
      } else {
        toolOutput = {
          success: false,
          output: '',
          error: `Araç bulunamadı: ${toolName}`
        };
      }

      const observationStep: AgentStep = {
        id: stepCount,
        type: 'observation',
        content: toolOutput.success ? toolOutput.output : `Hata: ${toolOutput.error}`,
        tool: toolName,
        toolOutput,
        timestamp: new Date()
      };
      steps.push(observationStep);
      onStep?.(observationStep);

      messages.push({
        role: 'assistant',
        content: content
      });

      messages.push({
        role: 'user',
        content: `Araç sonucu:\n${toolOutput.success ? toolOutput.output : `Hata: ${toolOutput.error}`}\n\nDevam et.`
      });
    } else {
      messages.push({
        role: 'assistant',
        content: content
      });
      messages.push({
        role: 'user',
        content: 'Devam et. Görev tamamlandıysa YANIT: ile bitir.'
      });
    }
  }

  return {
    response: steps.length > 0 ? steps[steps.length - 1].content : 'Maksimum adım sayısına ulaşıldı',
    steps,
    totalSteps: stepCount,
    toolsUsed: Array.from(toolsUsed),
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
  };
}

function getDefaultModel(provider: ProviderName): string {
  const defaults: Record<ProviderName, string> = {
    'ollama': 'llama3.2',
    'lmstudio': 'default',
    'free-models': 'llama3.2',
    'colab': 'qwen2.5-coder:7b',
    'openrouter': 'openai/gpt-4o',
    'groq': 'llama-3.1-8b-instant',
    'gemini': 'gemini-2.0-flash',
    'github-models': 'gpt-4o',
    'huggingface': 'meta-llama/Llama-3.1-8B-Instruct',
    'cloudflare': '@cf/meta/llama-3.1-8b-instruct'
  };
  return defaults[provider];
}
