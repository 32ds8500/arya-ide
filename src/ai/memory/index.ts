export { MemoryStore } from './memory-store';
export * from './types';

import { MemoryStore } from './memory-store';
import { MemoryScope, MemoryType, MemoryEntry } from './types';

export class MemoryManager {
  private stores: Map<string, MemoryStore> = new Map();
  private globalStore: MemoryStore;

  constructor() {
    this.globalStore = new MemoryStore();
    this.stores.set('global', this.globalStore);
  }

  getStore(scope: string): MemoryStore {
    if (!this.stores.has(scope)) {
      this.stores.set(scope, new MemoryStore());
    }
    return this.stores.get(scope)!;
  }

  saveMemory(params: {
    key: string;
    content: string;
    scope?: MemoryScope;
    type?: MemoryType;
    tags?: string[];
    scopeId?: string;
  }): MemoryEntry {
    const { scope = 'project', scopeId, ...rest } = params;
    const storeId = scopeId ? `${scope}:${scopeId}` : scope;
    const store = this.getStore(storeId);
    return store.save({ ...rest, scope });
  }

  retrieveMemory(id: string, scope?: string): MemoryEntry | undefined {
    if (scope) {
      return this.getStore(scope).retrieve(id);
    }
    for (const store of this.stores.values()) {
      const entry = store.retrieve(id);
      if (entry) return entry;
    }
    return undefined;
  }

  searchMemory(query: {
    text: string;
    scope?: MemoryScope;
    type?: MemoryType;
    tags?: string[];
    limit?: number;
    scopeId?: string;
  }): MemoryEntry[] {
    const { scope, scopeId, ...rest } = query;

    if (scopeId && scope) {
      return this.getStore(`${scope}:${scopeId}`).search(rest);
    }

    if (scope) {
      return this.getStore(scope).search(rest);
    }

    const allResults: MemoryEntry[] = [];
    for (const store of this.stores.values()) {
      allResults.push(...store.search(rest));
    }

    allResults.sort((a, b) => {
      const scoreA = allResults.filter(r => r.key === a.key).length;
      const scoreB = allResults.filter(r => r.key === b.key).length;
      return scoreB - scoreA;
    });

    return allResults.slice(0, rest.limit || 10);
  }

  rankMemories(query: string, limit: number = 5): MemoryEntry[] {
    return this.searchMemory({ text: query, limit });
  }

  archiveMemory(id: string): boolean {
    for (const store of this.stores.values()) {
      if (store.archive(id)) return true;
    }
    return false;
  }

  deleteMemory(id: string): boolean {
    for (const store of this.stores.values()) {
      if (store.delete(id)) return true;
    }
    return false;
  }

  getStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [scope, store] of this.stores) {
      stats[scope] = store.getStats();
    }
    return stats;
  }

  exportAll(): Record<string, MemoryEntry[]> {
    const data: Record<string, MemoryEntry[]> = {};
    for (const [scope, store] of this.stores) {
      data[scope] = store.export();
    }
    return data;
  }

  importAll(data: Record<string, MemoryEntry[]>): void {
    for (const [scope, entries] of Object.entries(data)) {
      this.getStore(scope).import(entries);
    }
  }
}

export const memoryManager = new MemoryManager();
