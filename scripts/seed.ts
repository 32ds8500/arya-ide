import { db } from "../src/db";
import { users, aiModels, providers } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

const DEFAULT_PROVIDERS = [
  { name: "Ollama", slug: "ollama", baseUrl: "http://localhost:11434", apiKeyRequired: false, isActive: true },
  { name: "LM Studio", slug: "lmstudio", baseUrl: "http://localhost:1234", apiKeyRequired: false, isActive: true },
  { name: "OpenRouter", slug: "openrouter", baseUrl: "https://openrouter.ai/api/v1", apiKeyRequired: true, isActive: true },
  { name: "Groq", slug: "groq", baseUrl: "https://api.groq.com/openai/v1", apiKeyRequired: true, isActive: true },
  { name: "Gemini", slug: "gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta", apiKeyRequired: true, isActive: true },
  { name: "GitHub Models", slug: "github-models", baseUrl: "https://models.inference.ai.azure.com", apiKeyRequired: true, isActive: true },
  { name: "HuggingFace", slug: "huggingface", baseUrl: "https://api-inference.huggingface.co", apiKeyRequired: true, isActive: true },
  { name: "Cloudflare AI", slug: "cloudflare", baseUrl: "https://api.cloudflare.com/client/v4", apiKeyRequired: true, isActive: true },
];

const DEFAULT_MODELS = [
  { providerId: "ollama", modelId: "llama3.1", name: "Llama 3.1", description: "Meta'nın en son modeli", maxTokens: 8192, inputPrice: 0, outputPrice: 0, isFree: true },
  { providerId: "ollama", modelId: "codellama", name: "Code Llama", description: "Kod yazma için optimize", maxTokens: 8192, inputPrice: 0, outputPrice: 0, isFree: true },
  { providerId: "lmstudio", modelId: "local-model", name: "Yerel Model", description: "LM Studio yerel modeli", maxTokens: 8192, inputPrice: 0, outputPrice: 0, isFree: true },
  { providerId: "openrouter", modelId: "meta-llama/llama-3.1-8b-instruct:free", name: "Llama 3.1 8B (Ücretsiz)", description: "OpenRouter ücretsiz model", maxTokens: 8192, inputPrice: 0, outputPrice: 0, isFree: true },
  { providerId: "groq", modelId: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", description: "Groq hızlı model", maxTokens: 8192, inputPrice: 0, outputPrice: 0, isFree: true },
  { providerId: "groq", modelId: "mixtral-8x7b-32768", name: "Mixtral 8x7B", description: "Groq Mixtral model", maxTokens: 32768, inputPrice: 0, outputPrice: 0, isFree: true },
  { providerId: "gemini", modelId: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Google hızlı model", maxTokens: 8192, inputPrice: 0, outputPrice: 0, isFree: true },
  { providerId: "gemini", modelId: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "Google flash model", maxTokens: 8192, inputPrice: 0, outputPrice: 0, isFree: true },
  { providerId: "github-models", modelId: "gpt-4o-mini", name: "GPT-4o Mini", description: "GitHub Models GPT-4o Mini", maxTokens: 16384, inputPrice: 0, outputPrice: 0, isFree: true },
  { providerId: "huggingface", modelId: "meta-llama/Meta-Llama-3.1-8B-Instruct", name: "Llama 3.1 8B", description: "HuggingFace Llama", maxTokens: 8192, inputPrice: 0, outputPrice: 0, isFree: true },
  { providerId: "cloudflare", modelId: "@cf/meta/llama-3.1-8b-instruct", name: "Llama 3.1 8B", description: "Cloudflare Llama", maxTokens: 8192, inputPrice: 0, outputPrice: 0, isFree: true },
];

async function seed() {
  console.log("🌱 Veritabanı tohumlanıyor...");

  const [existingUser] = await db.select().from(users).where(eq(users.email, "admin@aryaide.com"));

  if (!existingUser) {
    await db.insert(users).values({
      email: "admin@aryaide.com",
      name: "Admin",
      password: hashPassword("admin123"),
      role: "admin",
    });
    console.log("✅ Admin kullanıcı oluşturuldu: admin@aryaide.com");
  } else {
    console.log("⏭️  Admin kullanıcı zaten mevcut");
  }

  for (const provider of DEFAULT_PROVIDERS) {
    const [existing] = await db.select().from(providers).where(eq(providers.slug, provider.slug));
    if (!existing) {
      await db.insert(providers).values(provider);
      console.log(`✅ Provider oluşturuldu: ${provider.name}`);
    }
  }

  for (const model of DEFAULT_MODELS) {
    const [existing] = await db.select().from(aiModels).where(eq(aiModels.modelId, model.modelId));
    if (!existing) {
      await db.insert(aiModels).values(model);
      console.log(`✅ Model oluşturuldu: ${model.name}`);
    }
  }

  console.log("🎉 Tohumlama tamamlandı!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Tohumlama başarısız:", error);
    process.exit(1);
  });
