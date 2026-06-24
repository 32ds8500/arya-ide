import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiModels } from "@/db/schema";
import { generateId } from "@/utils/crypto";

export interface CreateModelInput {
  name: string;
  provider: string;
  modelId: string;
  description?: string;
  maxTokens?: number;
  contextWindow?: number;
  inputPricePer1k?: number;
  outputPricePer1k?: number;
  supportsStreaming?: boolean;
  supportsTools?: boolean;
  isActive?: boolean;
}

export interface UpdateModelInput {
  name?: string;
  description?: string;
  maxTokens?: number;
  contextWindow?: number;
  inputPricePer1k?: number;
  outputPricePer1k?: number;
  supportsStreaming?: boolean;
  supportsTools?: boolean;
  isActive?: boolean;
}

export const modelService = {
  async list(opts?: { providerId?: string; isActive?: boolean }) {
    const conditions = [];
    if (opts?.providerId) conditions.push(eq(aiModels.providerId, opts.providerId));
    if (opts?.isActive !== undefined) conditions.push(eq(aiModels.isActive, opts.isActive));

    if (conditions.length === 0) {
      return db.select().from(aiModels).orderBy(aiModels.providerId, aiModels.name);
    }

    const { and } = await import("drizzle-orm");
    return db
      .select()
      .from(aiModels)
      .where(and(...conditions))
      .orderBy(aiModels.providerId, aiModels.name);
  },

  async get(id: string) {
    const [model] = await db.select().from(aiModels).where(eq(aiModels.id, id));
    return model ?? null;
  },

  async getByModelId(modelId: string) {
    const [model] = await db.select().from(aiModels).where(eq(aiModels.modelId, modelId));
    return model ?? null;
  },

  async create(input: CreateModelInput) {
    const id = generateId();
    const [model] = await db
      .insert(aiModels)
      .values({
        name: input.name,
        providerId: input.provider,
        modelId: input.modelId,
        description: input.description ?? null,
        maxTokens: input.maxTokens ?? 4096,
        inputPrice: input.inputPricePer1k ?? 0,
        outputPrice: input.outputPricePer1k ?? 0,
        isActive: input.isActive ?? true,
        capabilities: JSON.stringify({
          supportsStreaming: input.supportsStreaming ?? true,
          supportsTools: input.supportsTools ?? false,
        }),
      })
      .returning();
    return model;
  },

  async update(id: string, input: UpdateModelInput) {
    const [updated] = await db
      .update(aiModels)
      .set({ ...input } as any)
      .where(eq(aiModels.id, id))
      .returning();
    return updated ?? null;
  },

  async delete(id: string) {
    const [deleted] = await db
      .delete(aiModels)
      .where(eq(aiModels.id, id))
      .returning();
    return deleted ?? null;
  },

  async test(id: string, prompt: string = "Hello, respond with one word.") {
    const model = await this.get(id);
    if (!model) return { success: false, error: "Model not found" };

    const { aiService } = await import("./ai.service");
    const startTime = Date.now();

    try {
      const result = await aiService.chat({
        model: model.modelId,
        messages: [{ role: "user", content: prompt }],
        maxTokens: 100,
      });

      return {
        success: true,
        latencyMs: Date.now() - startTime,
        response: result.content,
        tokens: result.tokens,
      };
    } catch (error) {
      return {
        success: false,
        latencyMs: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  },
};
