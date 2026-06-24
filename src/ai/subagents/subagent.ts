import { SubagentConfig, SubagentResult, SubagentStatus } from './types';
import { SubagentRegistry } from './registry';
import { createAgent } from '../agents';
import { AgentType } from '../agents/types';

export class Subagent {
  private config: SubagentConfig;
  private registry: SubagentRegistry;
  private status: SubagentStatus = 'pending';
  private startTime: number = 0;
  private result: SubagentResult | null = null;
  private abortController: AbortController | null = null;

  constructor(config: SubagentConfig, registry: SubagentRegistry) {
    this.config = config;
    this.registry = registry;
    registry.register(config);
  }

  async start(): Promise<SubagentResult> {
    this.status = 'running';
    this.startTime = Date.now();
    this.registry.updateStatus(this.config.id, 'running');
    this.abortController = new AbortController();

    try {
      const agent = createAgent(this.config.type as AgentType, {
        id: this.config.id,
        model: this.config.model,
        provider: this.config.provider,
        tools: this.config.tools || [],
        maxSteps: 15
      });

      let input = this.config.prompt;
      if (this.config.context) {
        input = `Bağlam:\n${this.config.context}\n\nGörev:\n${this.config.prompt}`;
      }

      const output = await Promise.race([
        agent.execute(input),
        this.createTimeout()
      ]);

      const duration = Date.now() - this.startTime;

      this.result = {
        id: this.config.id,
        status: 'completed',
        output: output as string,
        duration,
        tokensUsed: 0
      };

      this.status = 'completed';
      this.registry.updateStatus(this.config.id, 'completed', output as string);

      return this.result;

    } catch (error: any) {
      const duration = Date.now() - this.startTime;

      this.result = {
        id: this.config.id,
        status: 'failed',
        output: '',
        error: error.message,
        duration,
        tokensUsed: 0
      };

      this.status = 'failed';
      this.registry.updateStatus(this.config.id, 'failed', undefined, error.message);

      if (this.config.maxRetries && this.registry.incrementRetries(this.config.id) < this.config.maxRetries) {
        return this.start();
      }

      return this.result;
    }
  }

  pause(): void {
    if (this.status === 'running') {
      this.status = 'paused';
      this.registry.updateStatus(this.config.id, 'paused');
    }
  }

  resume(): void {
    if (this.status === 'paused') {
      this.status = 'running';
      this.registry.updateStatus(this.config.id, 'running');
    }
  }

  cancel(): void {
    if (this.status === 'running' || this.status === 'paused') {
      this.abortController?.abort();
      this.status = 'cancelled';
      this.registry.updateStatus(this.config.id, 'cancelled');
    }
  }

  getStatus(): SubagentStatus {
    return this.status;
  }

  getResult(): SubagentResult | null {
    return this.result;
  }

  getId(): string {
    return this.config.id;
  }

  private createTimeout(): Promise<never> {
    return new Promise((_, reject) => {
      const timeout = this.config.timeout || 300000;
      setTimeout(() => {
        if (this.status === 'running') {
          this.cancel();
          reject(new Error(`Zaman aşımı: ${timeout}ms`));
        }
      }, timeout);
    });
  }
}
