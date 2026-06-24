import { MemoryEntry, MemoryQuery, MemoryScope, MemoryType, MemoryStats } from './types';
import { nanoid } from 'nanoid';

export class MemoryStore {
  private entries: Map<string, MemoryEntry> = new Map();

  save(params: {
    key: string;
    content: string;
    scope?: MemoryScope;
    type?: MemoryType;
    tags?: string[];
    expiresAt?: Date;
  }): MemoryEntry {
    const { key, content, scope = 'project', type = 'knowledge', tags = [], expiresAt } = params;

    const existing = this.findByKey(key, scope);
    if (existing) {
      existing.content = content;
      existing.type = type;
      existing.tags = tags;
      existing.updatedAt = new Date();
      if (expiresAt) existing.expiresAt = expiresAt;
      return existing;
    }

    const entry: MemoryEntry = {
      id: `mem_${nanoid(12)}`,
      key,
      content,
      scope,
      type,
      tags,
      score: 1.0,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt
    };

    this.entries.set(entry.id, entry);
    return entry;
  }

  retrieve(id: string): MemoryEntry | undefined {
    return this.entries.get(id);
  }

  search(query: MemoryQuery): MemoryEntry[] {
    const { text, scope, type, tags, limit = 10, minScore = 0 } = query;
    const searchTerms = text.toLowerCase().split(/\s+/).filter(Boolean);

    const scored: Array<{ entry: MemoryEntry; score: number }> = [];

    for (const entry of this.entries.values()) {
      if (entry.expiresAt && entry.expiresAt < new Date()) continue;
      if (scope && entry.scope !== scope) continue;
      if (type && entry.type !== type) continue;
      if (tags && tags.length > 0 && !tags.some(t => entry.tags.includes(t))) continue;

      let score = 0;
      const keyLower = entry.key.toLowerCase();
      const contentLower = entry.content.toLowerCase();

      for (const term of searchTerms) {
        if (keyLower.includes(term)) score += 3;
        if (contentLower.includes(term)) score += 1;
        if (entry.tags.some(t => t.toLowerCase().includes(term))) score += 2;
      }

      if (score > minScore) {
        scored.push({ entry, score: score * entry.score });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(s => s.entry);
  }

  rankMemories(query: string, limit: number = 5): MemoryEntry[] {
    return this.search({ text: query, limit });
  }

  archive(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    entry.expiresAt = new Date();
    return true;
  }

  delete(id: string): boolean {
    return this.entries.delete(id);
  }

  deleteByKey(key: string, scope?: MemoryScope): number {
    let count = 0;
    for (const [id, entry] of this.entries) {
      if (entry.key === key && (!scope || entry.scope === scope)) {
        this.entries.delete(id);
        count++;
      }
    }
    return count;
  }

  list(scope?: MemoryScope, type?: MemoryType): MemoryEntry[] {
    return Array.from(this.entries.values()).filter(e => {
      if (scope && e.scope !== scope) return false;
      if (type && e.type !== type) return false;
      if (e.expiresAt && e.expiresAt < new Date()) return false;
      return true;
    });
  }

  getStats(): MemoryStats {
    const entries = Array.from(this.entries.values()).filter(e =>
      !e.expiresAt || e.expiresAt >= new Date()
    );

    const byScope: Record<MemoryScope, number> = { global: 0, project: 0, session: 0, user: 0 };
    const byType: Record<MemoryType, number> = { knowledge: 0, preference: 0, rule: 0, note: 0, context: 0 };

    for (const entry of entries) {
      byScope[entry.scope]++;
      byType[entry.type]++;
    }

    return {
      totalEntries: entries.length,
      byScope,
      byType
    };
  }

  private findByKey(key: string, scope: MemoryScope): MemoryEntry | undefined {
    for (const entry of this.entries.values()) {
      if (entry.key === key && entry.scope === scope) return entry;
    }
    return undefined;
  }

  export(): MemoryEntry[] {
    return Array.from(this.entries.values());
  }

  import(entries: MemoryEntry[]): void {
    for (const entry of entries) {
      this.entries.set(entry.id, entry);
    }
  }
}
