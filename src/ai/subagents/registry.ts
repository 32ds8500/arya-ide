import { SubagentConfig, SubagentStatus, SubagentEvent, SubagentEventHandler } from './types';

interface SubagentEntry {
  config: SubagentConfig;
  status: SubagentStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  result: string | null;
  error: string | null;
  retries: number;
}

export class SubagentRegistry {
  private agents = new Map<string, SubagentEntry>();
  private history: SubagentEntry[] = [];
  private listeners: SubagentEventHandler[] = [];

  register(config: SubagentConfig): void {
    this.agents.set(config.id, {
      config,
      status: 'pending',
      startedAt: null,
      completedAt: null,
      result: null,
      error: null,
      retries: 0
    });
  }

  unregister(id: string): void {
    const entry = this.agents.get(id);
    if (entry) {
      this.history.push(entry);
      this.agents.delete(id);
    }
  }

  get(id: string): SubagentEntry | undefined {
    return this.agents.get(id);
  }

  getAll(): SubagentEntry[] {
    return Array.from(this.agents.values());
  }

  list(): SubagentConfig[] {
    return Array.from(this.agents.values()).map(e => e.config);
  }

  listByParent(parentId: string): SubagentConfig[] {
    return this.list().filter(c => c.parentId === parentId);
  }

  listByStatus(status: SubagentStatus): SubagentConfig[] {
    return Array.from(this.agents.values())
      .filter(e => e.status === status)
      .map(e => e.config);
  }

  updateStatus(id: string, status: SubagentStatus, result?: string, error?: string): void {
    const entry = this.agents.get(id);
    if (!entry) return;

    entry.status = status;
    if (status === 'running' && !entry.startedAt) {
      entry.startedAt = new Date();
    }
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      entry.completedAt = new Date();
    }
    if (result !== undefined) entry.result = result;
    if (error !== undefined) entry.error = error;

    this.emit({
      type: status === 'running' ? 'started' : status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'cancelled',
      subagentId: id,
      data: { result, error },
      timestamp: new Date()
    });
  }

  incrementRetries(id: string): number {
    const entry = this.agents.get(id);
    if (!entry) return 0;
    entry.retries++;
    return entry.retries;
  }

  getHistory(): SubagentEntry[] {
    return [...this.history];
  }

  onEvent(handler: SubagentEventHandler): () => void {
    this.listeners.push(handler);
    return () => {
      const idx = this.listeners.indexOf(handler);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private emit(event: SubagentEvent): void {
    for (const handler of this.listeners) {
      try {
        handler(event);
      } catch {
        // Listener hatası
      }
    }
  }
}
