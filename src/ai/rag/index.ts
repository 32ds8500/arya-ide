import { chunkFile, Chunk, ChunkingOptions } from './chunker';
import { getEmbedding, getEmbeddings, EmbeddingResult } from './embeddings';
import { storeEmbedding, searchSimilar, deleteEmbeddings, SearchResult } from './vector-store';
import { retrieve, RetrievalResult } from './retriever';
import { readdir, readFile, stat } from 'fs/promises';
import { join, extname, relative } from 'path';

export interface IndexOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  batchSize?: number;
  filePattern?: string;
  excludePattern?: string;
}

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  rerank?: boolean;
}

export interface IndexResult {
  projectId: string;
  filesProcessed: number;
  chunksCreated: number;
  embeddingsGenerated: number;
  duration: number;
}

export async function indexProject(
  projectId: string,
  projectPath: string,
  options: IndexOptions = {}
): Promise<IndexResult> {
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    batchSize = 100,
    filePattern,
    excludePattern = 'node_modules|.git|dist|build|__pycache__|coverage'
  } = options;

  const startTime = Date.now();
  const excludeRegex = excludePattern ? new RegExp(excludePattern) : null;
  const fileRegex = filePattern ? new RegExp(filePattern) : null;

  const files: string[] = [];
  const textExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.cs', '.rb', '.php', '.html', '.css', '.scss', '.json', '.yaml', '.yml', '.md', '.sql', '.sh', '.vue', '.svelte', '.txt']);

  const scan = async (dir: string) => {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (excludeRegex && excludeRegex.test(entry.name)) continue;
          if (entry.name.startsWith('.')) continue;
          await scan(fullPath);
        } else {
          if (excludeRegex && excludeRegex.test(entry.name)) continue;
          const ext = extname(entry.name).toLowerCase();
          if (!textExts.has(ext)) continue;
          if (fileRegex && !fileRegex.test(entry.name)) continue;

          const fileStat = await stat(fullPath);
          if (fileStat.size > 10 * 1024 * 1024) continue;

          files.push(fullPath);
        }
      }
    } catch {}
  };

  await scan(projectPath);

  await deleteEmbeddings(projectId);

  let totalChunks = 0;
  let totalEmbeddings = 0;

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const chunks: Chunk[] = [];

    for (const filePath of batch) {
      try {
        const content = await readFile(filePath, 'utf-8');
        const relPath = relative(projectPath, filePath);
        const fileChunks = chunkFile(content, {
          filePath: relPath,
          chunkSize,
          chunkOverlap
        });
        chunks.push(...fileChunks);
      } catch {}
    }

    totalChunks += chunks.length;

    const chunkTexts = chunks.map(c => c.content);
    const embeddings = await getEmbeddings(chunkTexts);

    for (let j = 0; j < chunks.length; j++) {
      if (embeddings[j]) {
        await storeEmbedding({
          id: `${projectId}_${i + j}`,
          projectId,
          filePath: chunks[j].filePath,
          chunkIndex: chunks[j].chunkIndex,
          content: chunks[j].content,
          embedding: embeddings[j],
          metadata: chunks[j].metadata
        });
        totalEmbeddings++;
      }
    }
  }

  return {
    projectId,
    filesProcessed: files.length,
    chunksCreated: totalChunks,
    embeddingsGenerated: totalEmbeddings,
    duration: Date.now() - startTime
  };
}

export async function search(
  query: string,
  projectId: string,
  options: SearchOptions = {}
): Promise<RetrievalResult[]> {
  return retrieve(query, projectId, options);
}

export { chunkFile } from './chunker';
export type { Chunk, ChunkingOptions } from './chunker';
export { getEmbedding, getEmbeddings } from './embeddings';
export type { EmbeddingResult } from './embeddings';
export { storeEmbedding, searchSimilar, deleteEmbeddings } from './vector-store';
export type { SearchResult } from './vector-store';
export { retrieve } from './retriever';
export type { RetrievalResult } from './retriever';
