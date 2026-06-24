import { AIProvider, ProviderConfig } from './base';
import { OllamaProvider } from './ollama';
import { LMStudioProvider } from './lmstudio';
import { OpenRouterProvider } from './openrouter';
import { GroqProvider } from './groq';
import { GeminiProvider } from './gemini';
import { GitHubModelsProvider } from './github-models';
import { HuggingFaceProvider } from './huggingface';
import { CloudflareProvider } from './cloudflare';
import { FreeModelsProvider } from './free-models';
import { ColabProvider } from './colab';

export type { AIProvider, Message, ChatOptions, StreamOptions, ChatResponse, TokenUsage, ModelInfo, ProviderConfig } from './base';
export { OllamaProvider } from './ollama';
export { LMStudioProvider } from './lmstudio';
export { OpenRouterProvider } from './openrouter';
export { GroqProvider } from './groq';
export { GeminiProvider } from './gemini';
export { GitHubModelsProvider } from './github-models';
export { HuggingFaceProvider } from './huggingface';
export { CloudflareProvider } from './cloudflare';
export { FreeModelsProvider } from './free-models';
export { ColabProvider } from './colab';

export type ProviderName = 'ollama' | 'lmstudio' | 'openrouter' | 'groq' | 'gemini' | 'github-models' | 'huggingface' | 'cloudflare' | 'free-models' | 'colab';

const providerRegistry = new Map<ProviderName, (config?: ProviderConfig) => AIProvider>([
  ['ollama', (config) => new OllamaProvider(config)],
  ['lmstudio', (config) => new LMStudioProvider(config)],
  ['free-models', (config) => new FreeModelsProvider(config)],
  ['colab', (config) => new ColabProvider(config)],
  ['openrouter', (config) => new OpenRouterProvider(config || { apiKey: '' })],
  ['groq', (config) => new GroqProvider(config || { apiKey: '' })],
  ['gemini', (config) => new GeminiProvider(config || { apiKey: '' })],
  ['github-models', (config) => new GitHubModelsProvider(config || { apiKey: '' })],
  ['huggingface', (config) => new HuggingFaceProvider(config || { apiKey: '' })],
  ['cloudflare', (config) => new CloudflareProvider(config || { apiKey: '' })],
]);

const providerInstances = new Map<string, AIProvider>();

export function getProvider(name: ProviderName): AIProvider | undefined {
  return providerInstances.get(name);
}

export function createProvider(name: ProviderName, config?: ProviderConfig): AIProvider {
  const factory = providerRegistry.get(name);
  if (!factory) {
    throw new Error(`Bilinmeyen saglayici: ${name}. Mevcut saglayicilar: ${listProviders().join(', ')}`);
  }

  const existing = providerInstances.get(name);
  if (existing && !config) {
    return existing;
  }

  const provider = factory(config);
  providerInstances.set(name, provider);
  return provider;
}

export function listProviders(): ProviderName[] {
  return Array.from(providerRegistry.keys());
}

export async function getAvailableProviders(): Promise<ProviderName[]> {
  const available: ProviderName[] = [];
  const providers = listProviders();

  for (const name of providers) {
    const provider = createProvider(name);
    if (await provider.isAvailable()) {
      available.push(name);
    }
  }

  return available;
}

export function resetProviders(): void {
  providerInstances.clear();
}

export const FREE_PROVIDER_PRIORITY: ProviderName[] = [
  'ollama',
  'lmstudio',
  'colab',
  'free-models',
  'groq',
  'gemini',
  'openrouter'
];

export async function getFreeProviders(): Promise<ProviderName[]> {
  const available = await getAvailableProviders();
  return FREE_PROVIDER_PRIORITY.filter(p => available.includes(p));
}
