import { db } from './index';
import { providers, users, aiModels } from './schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${buf.toString('hex')}`;
}

const defaultProviders = [
  { name: 'Ollama', slug: 'ollama', baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434', apiKeyRequired: false, isActive: true, config: JSON.stringify({ capabilities: ['chat', 'completion', 'embeddings'], local: true }) },
  { name: 'LM Studio', slug: 'lmstudio', baseUrl: process.env.LM_STUDIO_BASE_URL || 'http://localhost:1234', apiKeyRequired: false, isActive: true, config: JSON.stringify({ capabilities: ['chat', 'completion', 'embeddings'], local: true }) },
  { name: 'OpenRouter', slug: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1', apiKeyRequired: true, isActive: true, config: JSON.stringify({ capabilities: ['chat', 'completion', 'embeddings'], local: false }) },
  { name: 'Groq', slug: 'groq', baseUrl: 'https://api.groq.com/openai/v1', apiKeyRequired: true, isActive: true, config: JSON.stringify({ capabilities: ['chat', 'completion'], local: false }) },
  { name: 'Gemini', slug: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', apiKeyRequired: true, isActive: true, config: JSON.stringify({ capabilities: ['chat', 'completion', 'embeddings', 'vision'], local: false }) },
  { name: 'GitHub Models', slug: 'github-models', baseUrl: 'https://models.inference.ai.azure.com', apiKeyRequired: true, isActive: true, config: JSON.stringify({ capabilities: ['chat', 'completion'], local: false }) },
  { name: 'HuggingFace', slug: 'huggingface', baseUrl: 'https://api-inference.huggingface.co/v1', apiKeyRequired: true, isActive: true, config: JSON.stringify({ capabilities: ['chat', 'completion', 'embeddings'], local: false }) },
  { name: 'Cloudflare AI', slug: 'cloudflare-ai', baseUrl: 'https://api.cloudflare.com/client/v4/accounts', apiKeyRequired: true, isActive: true, config: JSON.stringify({ capabilities: ['chat', 'completion', 'embeddings'], local: false }) },
];

const defaultModels = [
  { providerId: 'ollama', modelId: 'llama3.1:8b', name: 'Llama 3.1 8B', description: 'Meta Llama 3.1 8B - fast and efficient', maxTokens: 8192, inputPrice: 0, outputPrice: 0, isActive: true, isFree: true, capabilities: JSON.stringify({ chat: true, completion: true, embeddings: false }) },
  { providerId: 'ollama', modelId: 'llama3.1:70b', name: 'Llama 3.1 70B', description: 'Meta Llama 3.1 70B - high quality', maxTokens: 8192, inputPrice: 0, outputPrice: 0, isActive: true, isFree: true, capabilities: JSON.stringify({ chat: true, completion: true, embeddings: false }) },
  { providerId: 'ollama', modelId: 'codellama:34b', name: 'Code Llama 34B', description: 'Code-specialized Llama model', maxTokens: 16384, inputPrice: 0, outputPrice: 0, isActive: true, isFree: true, capabilities: JSON.stringify({ chat: true, completion: true, embeddings: false }) },
  { providerId: 'ollama', modelId: 'qwen2.5-coder:32b', name: 'Qwen 2.5 Coder 32B', description: 'Alibaba Qwen 2.5 Coder - excellent for coding', maxTokens: 32768, inputPrice: 0, outputPrice: 0, isActive: true, isFree: true, capabilities: JSON.stringify({ chat: true, completion: true, embeddings: false }) },
  { providerId: 'lmstudio', modelId: 'local-model', name: 'Local Model', description: 'Model loaded in LM Studio', maxTokens: 4096, inputPrice: 0, outputPrice: 0, isActive: true, isFree: true, capabilities: JSON.stringify({ chat: true, completion: true, embeddings: false }) },
  { providerId: 'openrouter', modelId: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', description: 'Anthropic Claude Sonnet 4', maxTokens: 8192, inputPrice: 0.003, outputPrice: 0.015, isActive: true, isFree: false, capabilities: JSON.stringify({ chat: true, completion: true, vision: true }) },
  { providerId: 'openrouter', modelId: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', description: 'Fast and affordable', maxTokens: 8192, inputPrice: 0.001, outputPrice: 0.005, isActive: true, isFree: false, capabilities: JSON.stringify({ chat: true, completion: true, vision: true }) },
  { providerId: 'openrouter', modelId: 'openai/gpt-4o', name: 'GPT-4o', description: 'OpenAI GPT-4o', maxTokens: 128000, inputPrice: 0.0025, outputPrice: 0.01, isActive: true, isFree: false, capabilities: JSON.stringify({ chat: true, completion: true, vision: true }) },
  { providerId: 'openrouter', modelId: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Google Gemini 2.5 Pro', maxTokens: 1048576, inputPrice: 0.00125, outputPrice: 0.01, isActive: true, isFree: false, capabilities: JSON.stringify({ chat: true, completion: true, vision: true }) },
  { providerId: 'groq', modelId: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'Groq-hosted Llama 3.3 70B', maxTokens: 8192, inputPrice: 0.00059, outputPrice: 0.00079, isActive: true, isFree: false, capabilities: JSON.stringify({ chat: true, completion: true }) },
  { providerId: 'groq', modelId: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', description: 'Ultra-fast inference on Groq', maxTokens: 8192, inputPrice: 0.0001, outputPrice: 0.0001, isActive: true, isFree: false, capabilities: JSON.stringify({ chat: true, completion: true }) },
  { providerId: 'groq', modelId: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'Mistral Mixtral 8x7B', maxTokens: 32768, inputPrice: 0.00024, outputPrice: 0.00024, isActive: true, isFree: false, capabilities: JSON.stringify({ chat: true, completion: true }) },
  { providerId: 'gemini', modelId: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Google Gemini 2.5 Pro', maxTokens: 1048576, inputPrice: 0.00125, outputPrice: 0.01, isActive: true, isFree: false, capabilities: JSON.stringify({ chat: true, completion: true, vision: true }) },
  { providerId: 'gemini', modelId: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast and affordable Gemini', maxTokens: 1048576, inputPrice: 0.00015, outputPrice: 0.0006, isActive: true, isFree: false, capabilities: JSON.stringify({ chat: true, completion: true, vision: true }) },
  { providerId: 'github-models', modelId: 'gpt-4o', name: 'GPT-4o (GitHub)', description: 'GPT-4o via GitHub Models', maxTokens: 128000, inputPrice: 0.0025, outputPrice: 0.01, isActive: true, isFree: false, capabilities: JSON.stringify({ chat: true, completion: true, vision: true }) },
  { providerId: 'github-models', modelId: 'gpt-4o-mini', name: 'GPT-4o Mini (GitHub)', description: 'GPT-4o Mini via GitHub Models', maxTokens: 128000, inputPrice: 0.00015, outputPrice: 0.0006, isActive: true, isFree: false, capabilities: JSON.stringify({ chat: true, completion: true, vision: true }) },
  { providerId: 'huggingface', modelId: 'meta-llama/Meta-Llama-3.1-70B-Instruct', name: 'Llama 3.1 70B (HF)', description: 'HuggingFace Inference API', maxTokens: 8192, inputPrice: 0.00035, outputPrice: 0.0004, isActive: true, isFree: false, capabilities: JSON.stringify({ chat: true, completion: true }) },
  { providerId: 'cloudflare-ai', modelId: '@cf/meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B (CF)', description: 'Cloudflare Workers AI', maxTokens: 8192, inputPrice: 0, outputPrice: 0, isActive: true, isFree: true, capabilities: JSON.stringify({ chat: true, completion: true }) },
];

async function seed() {
  console.log('Seeding database...');

  const insertedProviders = await db.insert(providers).values(defaultProviders).onConflictDoNothing().returning();
  console.log(`Inserted ${insertedProviders.length} providers`);

  const insertedModels = await db.insert(aiModels).values(defaultModels).onConflictDoNothing().returning();
  console.log(`Inserted ${insertedModels.length} models`);

  const adminPassword = await hashPassword('admin123');
  const [adminUser] = await db
    .insert(users)
    .values({
      email: 'admin@aryaide.com',
      name: 'Admin',
      password: adminPassword,
      role: 'superadmin',
      emailVerified: true,
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();
  console.log('Admin user created:', adminUser?.email ?? 'already exists');

  console.log('Seeding complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
