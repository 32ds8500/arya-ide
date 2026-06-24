export const APP_NAME = 'Arya IDE';
export const APP_VERSION = '1.0.0';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const SUPPORTED_LANGUAGES = [
  'typescript', 'javascript', 'tsx', 'jsx', 'python', 'rust', 'go',
  'java', 'c', 'cpp', 'csharp', 'ruby', 'php', 'swift', 'kotlin',
  'html', 'css', 'scss', 'json', 'yaml', 'toml', 'xml', 'sql',
  'markdown', 'bash', 'powershell', 'dockerfile', 'graphql',
] as const;

export const DEFAULT_MODEL = {
  providerId: 'ollama',
  modelId: 'llama3.1:8b',
};

export const RATE_LIMITS = {
  chat: { requests: 30, windowMs: 60_000 },
  auth: { requests: 5, windowMs: 900_000 },
  api: { requests: 100, windowMs: 60_000 },
  fileUpload: { requests: 20, windowMs: 60_000 },
} as const;

export const AI_PROVIDERS = [
  'ollama', 'lmstudio', 'openrouter', 'groq',
  'gemini', 'github-models', 'huggingface', 'cloudflare-ai',
] as const;
