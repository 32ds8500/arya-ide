export type MemoryScope = 'global' | 'project' | 'session' | 'user';

export type MemoryType = 'knowledge' | 'preference' | 'rule' | 'note' | 'context';

export interface MemoryEntry {
  id: string;
  key: string;
  content: string;
  scope: MemoryScope;
  type: MemoryType;
  tags: string[];
  score: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface MemoryQuery {
  text: string;
  scope?: MemoryScope;
  type?: MemoryType;
  tags?: string[];
  limit?: number;
  minScore?: number;
}

export interface MemoryStats {
  totalEntries: number;
  byScope: Record<MemoryScope, number>;
  byType: Record<MemoryType, number>;
}
