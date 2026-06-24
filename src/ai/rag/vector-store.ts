import { cosineSimilarity } from './embeddings';

export interface StoredEmbedding {
  id: string;
  projectId: string;
  filePath: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
  metadata: {
    totalChunks: number;
    wordCount: number;
    charCount: number;
  };
}

export interface SearchResult {
  id: string;
  filePath: string;
  chunkIndex: number;
  content: string;
  score: number;
  metadata: Record<string, any>;
}

export interface VectorStoreConfig {
  persistPath?: string;
  maxResults?: number;
}

const embeddingStore = new Map<string, StoredEmbedding[]>();
let config: VectorStoreConfig = {};

export function configureVectorStore(cfg: VectorStoreConfig): void {
  config = { ...config, ...cfg };
}

export async function storeEmbedding(embedding: StoredEmbedding): Promise<void> {
  const projectEmbeddings = embeddingStore.get(embedding.projectId) || [];
  
  const existingIndex = projectEmbeddings.findIndex(
    e => e.filePath === embedding.filePath && e.chunkIndex === embedding.chunkIndex
  );

  if (existingIndex >= 0) {
    projectEmbeddings[existingIndex] = embedding;
  } else {
    projectEmbeddings.push(embedding);
  }

  embeddingStore.set(embedding.projectId, projectEmbeddings);
}

export async function searchSimilar(
  queryEmbedding: number[],
  projectId: string,
  limit: number = 10
): Promise<SearchResult[]> {
  const projectEmbeddings = embeddingStore.get(projectId) || [];

  const similarities = projectEmbeddings.map(embedding => ({
    embedding,
    score: cosineSimilarity(queryEmbedding, embedding.embedding)
  }));

  similarities.sort((a, b) => b.score - a.score);

  return similarities.slice(0, limit).map(({ embedding, score }) => ({
    id: embedding.id,
    filePath: embedding.filePath,
    chunkIndex: embedding.chunkIndex,
    content: embedding.content,
    score,
    metadata: embedding.metadata
  }));
}

export async function deleteEmbeddings(projectId: string): Promise<void> {
  embeddingStore.delete(projectId);
}

export async function getProjectEmbeddings(projectId: string): Promise<StoredEmbedding[]> {
  return embeddingStore.get(projectId) || [];
}

export async function getEmbeddingCount(projectId: string): Promise<number> {
  const embeddings = embeddingStore.get(projectId) || [];
  return embeddings.length;
}

export async function getProjectStats(projectId: string): Promise<{
  totalChunks: number;
  totalFiles: number;
  totalCharacters: number;
  averageChunkSize: number;
}> {
  const embeddings = embeddingStore.get(projectId) || [];
  
  const files = new Set(embeddings.map(e => e.filePath));
  const totalChars = embeddings.reduce((sum, e) => sum + e.content.length, 0);

  return {
    totalChunks: embeddings.length,
    totalFiles: files.size,
    totalCharacters: totalChars,
    averageChunkSize: embeddings.length > 0 ? totalChars / embeddings.length : 0
  };
}

export async function exportEmbeddings(projectId: string): Promise<string> {
  const embeddings = embeddingStore.get(projectId) || [];
  return JSON.stringify(embeddings, null, 2);
}

export async function importEmbeddings(projectId: string, data: string): Promise<number> {
  try {
    const embeddings: StoredEmbedding[] = JSON.parse(data);
    const projectEmbeddings = embeddingStore.get(projectId) || [];
    
    for (const embedding of embeddings) {
      const existingIndex = projectEmbeddings.findIndex(
        e => e.filePath === embedding.filePath && e.chunkIndex === embedding.chunkIndex
      );

      if (existingIndex >= 0) {
        projectEmbeddings[existingIndex] = embedding;
      } else {
        projectEmbeddings.push(embedding);
      }
    }

    embeddingStore.set(projectId, projectEmbeddings);
    return embeddings.length;
  } catch {
    return 0;
  }
}
