export interface EmbeddingResult {
  embedding: number[];
  model: string;
  dimensions: number;
}

export interface EmbeddingConfig {
  provider?: 'ollama' | 'openai' | 'local';
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  dimensions?: number;
  batchSize?: number;
}

const DEFAULT_CONFIG: EmbeddingConfig = {
  provider: 'ollama',
  model: 'nomic-embed-text',
  baseUrl: 'http://localhost:11434',
  dimensions: 768,
  batchSize: 100
};

let currentConfig: EmbeddingConfig = { ...DEFAULT_CONFIG };

export function configureEmbeddings(config: EmbeddingConfig): void {
  currentConfig = { ...DEFAULT_CONFIG, ...config };
}

export async function getEmbedding(
  text: string,
  config?: EmbeddingConfig
): Promise<number[]> {
  const cfg = config || currentConfig;

  switch (cfg.provider) {
    case 'ollama':
      return getOllamaEmbedding(text, cfg);
    case 'openai':
      return getOpenAIEmbedding(text, cfg);
    case 'local':
    default:
      return getLocalEmbedding(text, cfg);
  }
}

export async function getEmbeddings(
  texts: string[],
  config?: EmbeddingConfig
): Promise<number[][]> {
  const cfg = config || currentConfig;
  const batchSize = cfg.batchSize || 100;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(text => getEmbedding(text, cfg))
    );
    
    results.push(...batchResults);
  }

  return results;
}

async function getOllamaEmbedding(text: string, config: EmbeddingConfig): Promise<number[]> {
  const baseUrl = config.baseUrl || 'http://localhost:11434';
  const model = config.model || 'nomic-embed-text';

  try {
    const response = await fetch(`${baseUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding hatası: ${response.status}`);
    }

    const data = await response.json();
    return data.embeddings?.[0] || data.embedding || [];
  } catch (error) {
    console.error('Ollama embedding hatası:', error);
    return getLocalEmbedding(text, config);
  }
}

async function getOpenAIEmbedding(text: string, config: EmbeddingConfig): Promise<number[]> {
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
  const model = config.model || 'text-embedding-3-small';

  if (!apiKey) {
    throw new Error('OpenAI API anahtarı gerekli');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: text,
      dimensions: config.dimensions
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI embedding hatası: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data?.[0]?.embedding || [];
}

function getLocalEmbedding(text: string, config: EmbeddingConfig): number[] {
  const dimensions = config.dimensions || 768;
  const embedding: number[] = new Array(dimensions).fill(0);

  const words = text.toLowerCase().split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const hash = simpleHash(word);
    
    for (let j = 0; j < dimensions; j++) {
      const seed = hash * (j + 1) * (i + 1);
      embedding[j] += Math.sin(seed) * Math.cos(seed * 0.1);
    }
  }

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vktör boyutları eşleşmiyor');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function normalizeEmbedding(embedding: number[]): number[] {
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return embedding;
  return embedding.map(val => val / magnitude);
}
