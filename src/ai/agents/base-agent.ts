import { Message } from '../providers/base';
import { createProvider, ProviderName } from '../providers';
import { getTool, listTools } from '../tools';
import { AgentConfig, AgentState, AgentStep, AgentMessage } from './types';

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected state: AgentState;
  protected messages: Message[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
    this.state = {
      id: config.id,
      type: config.type,
      status: 'idle',
      steps: [],
      result: null,
      error: null,
      startedAt: null,
      completedAt: null
    };
  }

  abstract getSystemPrompt(): string;

  async execute(input: string): Promise<string> {
    this.state.status = 'running';
    this.state.startedAt = new Date();

    try {
      const provider = createProvider(this.config.provider as ProviderName);
      const availableTools = this.getAvailableTools();

      const toolDescriptions = availableTools.map(t => {
        const params = Object.entries(t.definition.parameters)
          .map(([name, param]) => `    ${name}: ${param.description}${param.required ? ' (gerekli)' : ''}`)
          .join('\n');
        return `${t.name}: ${t.description}\n  Parametreler:\n${params}`;
      }).join('\n\n');

      const systemPrompt = `${this.getSystemPrompt()}\n\nMevcut araçlar:\n${toolDescriptions}\n\nBir görevi yerine getirmek için şu formatta düşün ve hareket et:\nDÜŞÜNCE: <gözlem ve plan>\nARAÇ: <kullanılacak araç adı>\nARAÇ_GİRDİSİ: <JSON formatında girdi parametreleri>\nSONRAKİ ADIM: <bir sonraki adımın açıklaması>\n\nGörev tamamlandığında:\nDÜŞÜNCE: Görev tamamlandı\nYANIT: <kullanıcıya yanıtı>\n\nHer adımda SADECE bir araç kullan. Araç sonuçlarını almadan bir sonraki adıma geçme.`;

      this.messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input }
      ];

      let stepCount = 0;

      while (stepCount < this.config.maxSteps) {
        stepCount++;

        const response = await provider.chat(this.messages, this.config.model, {
          temperature: 0.7,
          maxTokens: 4096
        });

        const content = response.content;

        const thoughtMatch = content.match(/DÜŞÜNCE:\s*(.+?)(?=ARAÇ:|YANIT:|$)/s);
        const actionMatch = content.match(/ARAÇ:\s*(.+?)(?=\n|$)/s);
        const inputMatch = content.match(/ARAÇ_GİRDİSİ:\s*(.+?)(?=SONRAKİ ADIM:|DÜŞÜNCE:|YANIT:|$)/s);
        const responseMatch = content.match(/YANIT:\s*(.+)$/s);

        if (thoughtMatch) {
          this.addStep({
            id: stepCount,
            type: 'thought',
            content: thoughtMatch[1].trim(),
            timestamp: new Date()
          });
        }

        if (responseMatch) {
          this.addStep({
            id: stepCount,
            type: 'response',
            content: responseMatch[1].trim(),
            timestamp: new Date()
          });

          this.state.status = 'completed';
          this.state.result = responseMatch[1].trim();
          this.state.completedAt = new Date();
          return responseMatch[1].trim();
        }

        if (actionMatch && inputMatch) {
          const toolName = actionMatch[1].trim();
          let toolInput: Record<string, any>;

          try {
            toolInput = JSON.parse(inputMatch[1].trim());
          } catch {
            toolInput = {};
          }

          this.addStep({
            id: stepCount,
            type: 'action',
            content: `Araç çağrısı: ${toolName}`,
            tool: toolName,
            toolInput,
            timestamp: new Date()
          });

          const tool = getTool(toolName);
          let toolOutput: string;

          if (tool) {
            try {
              const result = await tool.execute(toolInput);
              toolOutput = result.success ? result.output : `Hata: ${result.error}`;
            } catch (error: any) {
              toolOutput = `Araç hatası: ${error.message}`;
            }
          } else {
            toolOutput = `Araç bulunamadı: ${toolName}`;
          }

          this.addStep({
            id: stepCount,
            type: 'observation',
            content: toolOutput,
            tool: toolName,
            toolOutput,
            timestamp: new Date()
          });

          this.messages.push({ role: 'assistant', content });
          this.messages.push({ role: 'user', content: `Araç sonucu:\n${toolOutput}\n\nDevam et.` });
        } else {
          this.messages.push({ role: 'assistant', content });
          this.messages.push({ role: 'user', content: 'Devam et. Görev tamamlandıysa YANIT: ile bitir.' });
        }
      }

      this.state.status = 'completed';
      this.state.result = this.state.steps.length > 0
        ? this.state.steps[this.state.steps.length - 1].content
        : 'Maksimum adım sayısına ulaşıldı';
      this.state.completedAt = new Date();
      return this.state.result;

    } catch (error: any) {
      this.state.status = 'failed';
      this.state.error = error.message;
      this.state.completedAt = new Date();
      throw error;
    }
  }

  pause(): void {
    if (this.state.status === 'running') {
      this.state.status = 'paused';
    }
  }

  resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'running';
    }
  }

  terminate(): void {
    this.state.status = 'failed';
    this.state.error = 'Agent sonlandırıldı';
    this.state.completedAt = new Date();
  }

  getState(): AgentState {
    return { ...this.state };
  }

  toMessage(): AgentMessage {
    return {
      role: 'assistant',
      content: this.state.result || '',
      agentId: this.state.id,
      timestamp: new Date()
    };
  }

  protected addStep(step: AgentStep): void {
    this.state.steps.push(step);
  }

  protected getAvailableTools() {
    const allTools = listTools();
    if (this.config.tools.length === 0) return allTools;
    return allTools.filter(t => this.config.tools.includes(t.name));
  }
}
