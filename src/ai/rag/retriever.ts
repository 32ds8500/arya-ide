import { getEmbedding, cosineSimilarity } from './embeddings';
import { searchSimilar, SearchResult, getProjectEmbeddings, StoredEmbedding } from './vector-store';

export interface RetrievalOptions {
  limit?: number;
  threshold?: number;
  rerank?: boolean;
  hybridWeight?: number;
}

export interface RetrievalResult {
  id: string;
  filePath: string;
  chunkIndex: number;
  content: string;
  score: number;
  rank: number;
  metadata: Record<string, any>;
}

export async function retrieve(
  query: string,
  projectId: string,
  options: RetrievalOptions = {}
): Promise<RetrievalResult[]> {
  const {
    limit = 10,
    threshold = 0.3,
    rerank = true,
    hybridWeight = 0.7
  } = options;

  const queryEmbedding = await getEmbedding(query);
  const semanticResults = await searchSimilar(queryEmbedding, projectId, limit * 2);

  const projectEmbeddings = await getProjectEmbeddings(projectId);
  const keywordResults = keywordSearch(query, projectEmbeddings, limit * 2);

  let combinedResults: SearchResult[];

  if (rerank) {
    combinedResults = hybridRerank(semanticResults, keywordResults, hybridWeight);
  } else {
    combinedResults = semanticResults;
  }

  const filteredResults = combinedResults.filter(r => r.score >= threshold);

  return filteredResults.slice(0, limit).map((result, index) => ({
    id: result.id,
    filePath: result.filePath,
    chunkIndex: result.chunkIndex,
    content: result.content,
    score: result.score,
    rank: index + 1,
    metadata: result.metadata
  }));
}

function keywordSearch(
  query: string,
  embeddings: StoredEmbedding[],
  limit: number
): SearchResult[] {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  
  if (queryTerms.length === 0) return [];

  const scored = embeddings.map(embedding => {
    const contentLower = embedding.content.toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      const regex = new RegExp(term, 'gi');
      const matches = contentLower.match(regex);
      if (matches) {
        score += matches.length * 0.1;
      }
    }

    const exactPhraseMatch = contentLower.includes(query.toLowerCase());
    if (exactPhraseMatch) {
      score += 0.5;
    }

    return {
      id: embedding.id,
      filePath: embedding.filePath,
      chunkIndex: embedding.chunkIndex,
      content: embedding.content,
      score: Math.min(score, 1.0),
      metadata: embedding.metadata
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

function hybridRerank(
  semanticResults: SearchResult[],
  keywordResults: SearchResult[],
  semanticWeight: number
): SearchResult[] {
  const scoreMap = new Map<string, { semantic: number; keyword: number; result: SearchResult }>();

  for (const result of semanticResults) {
    scoreMap.set(result.id, {
      semantic: result.score,
      keyword: 0,
      result
    });
  }

  for (const result of keywordResults) {
    const existing = scoreMap.get(result.id);
    if (existing) {
      existing.keyword = result.score;
    } else {
      scoreMap.set(result.id, {
        semantic: 0,
        keyword: result.score,
        result
      });
    }
  }

  const reranked: SearchResult[] = [];

  for (const [, scores] of scoreMap) {
    const hybridScore = (scores.semantic * semanticWeight) + 
                       (scores.keyword * (1 - semanticWeight));
    
    reranked.push({
      ...scores.result,
      score: hybridScore
    });
  }

  reranked.sort((a, b) => b.score - a.score);
  return reranked;
}

export function formatRetrievalResults(results: RetrievalResult[]): string {
  if (results.length === 0) {
    return 'Sonuç bulunamadı.';
  }

  const output: string[] = [
    `📚 RAG Sonuçları (${results.length} sonuç)`,
    ''
  ];

  for (const result of results) {
    output.push(
      `${result.rank}. ${result.filePath} (Satır: ${result.chunkIndex + 1})`,
      `   Skor: ${(result.score * 100).toFixed(1)}%`,
      `   ${result.content.substring(0, 150)}${result.content.length > 150 ? '...' : ''}`,
      ''
    );
  }

  return output.join('\n');
}
