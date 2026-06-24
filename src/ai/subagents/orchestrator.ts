import { SubagentConfig, SubagentResult, SubagentEvent, SubagentEventHandler } from './types';
import { SubagentRegistry } from './registry';
import { Subagent } from './subagent';

export class Orchestrator {
  private registry: SubagentRegistry;
  private activeAgents: Map<string, Subagent> = new Map();

  constructor() {
    this.registry = new SubagentRegistry();
  }

  async spawnAgent(config: SubagentConfig): Promise<string> {
    const id = config.id || `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const subagentConfig = { ...config, id };

    const subagent = new Subagent(subagentConfig, this.registry);
    this.activeAgents.set(id, subagent);

    subagent.start().then(() => {
      this.activeAgents.delete(id);
    });

    return id;
  }

  async terminateAgent(id: string): Promise<boolean> {
    const subagent = this.activeAgents.get(id);
    if (subagent) {
      subagent.cancel();
      this.activeAgents.delete(id);
      return true;
    }
    return false;
  }

  pauseAgent(id: string): boolean {
    const subagent = this.activeAgents.get(id);
    if (subagent) {
      subagent.pause();
      return true;
    }
    return false;
  }

  resumeAgent(id: string): boolean {
    const subagent = this.activeAgents.get(id);
    if (subagent) {
      subagent.resume();
      return true;
    }
    return false;
  }

  async handoffAgent(id: string, newConfig: Partial<SubagentConfig>): Promise<string> {
    const subagent = this.activeAgents.get(id);
    if (subagent) {
      subagent.cancel();
      this.activeAgents.delete(id);
    }

    const entry = this.registry.get(id);
    const mergedConfig: SubagentConfig = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: newConfig.type || entry?.config.type || 'builder',
      prompt: newConfig.prompt || entry?.config.prompt || '',
      context: newConfig.context || entry?.config.context,
      parentId: id,
      timeout: newConfig.timeout || entry?.config.timeout,
      maxRetries: newConfig.maxRetries || entry?.config.maxRetries,
      model: newConfig.model || entry?.config.model,
      provider: newConfig.provider || entry?.config.provider,
      tools: newConfig.tools || entry?.config.tools
    };

    return this.spawnAgent(mergedConfig);
  }

  getAgentStatus(id: string): SubagentConfig & { status: string } | null {
    const entry = this.registry.get(id);
    if (!entry) return null;
    return { ...entry.config, status: entry.status };
  }

  async waitForAgent(id: string, timeout: number = 300000): Promise<SubagentResult | null> {
    const subagent = this.activeAgents.get(id);
    if (!subagent) {
      const entry = this.registry.get(id);
      if (!entry) return null;
      return {
        id,
        status: entry.status as any,
        output: entry.result || '',
        error: entry.error || undefined,
        duration: entry.completedAt && entry.startedAt
          ? entry.completedAt.getTime() - entry.startedAt.getTime()
          : 0,
        tokensUsed: 0
      };
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      const check = () => {
        const status = subagent.getStatus();
        if (status === 'completed' || status === 'failed' || status === 'cancelled') {
          resolve(subagent.getResult());
        } else if (Date.now() - startTime > timeout) {
          resolve(null);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  listActive(): SubagentConfig[] {
    return Array.from(this.activeAgents.values()).map(s => {
      const entry = this.registry.get(s.getId());
      return entry?.config || { id: s.getId(), type: 'unknown', prompt: '' };
    });
  }

  listAll(): SubagentConfig[] {
    return this.registry.list();
  }

  onEvent(handler: SubagentEventHandler): () => void {
    return this.registry.onEvent(handler);
  }
}
