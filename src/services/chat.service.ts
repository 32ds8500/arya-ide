import { eq, desc, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { chats, messages } from "@/db/schema";
import { generateId } from "@/utils/crypto";

export interface CreateChatInput {
  projectId: string;
  title?: string;
  modelId?: string;
}

export interface AddMessageInput {
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  tokens?: number;
  cost?: number;
  metadata?: Record<string, unknown>;
}

export const chatService = {
  async create(input: CreateChatInput) {
    const id = generateId();
    const [chat] = await db
      .insert(chats)
      .values({
        id,
        userId: "system",
        projectId: input.projectId,
        title: input.title ?? "New Chat",
        modelId: input.modelId ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    return chat;
  },

  async getById(id: string) {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat ?? null;
  },

  async list(projectId: string, opts?: { limit?: number; offset?: number }) {
    const limit = opts?.limit ?? 50;
    const offset = opts?.offset ?? 0;
    return db
      .select()
      .from(chats)
      .where(eq(chats.projectId, projectId))
      .orderBy(desc(chats.updatedAt))
      .limit(limit)
      .offset(offset);
  },

  async delete(id: string) {
    await db.delete(messages).where(eq(messages.chatId, id));
    const [deleted] = await db
      .delete(chats)
      .where(eq(chats.id, id))
      .returning();
    return deleted ?? null;
  },

  async addMessage(input: AddMessageInput) {
    const [message] = await db
      .insert(messages)
      .values({
        chatId: input.chatId,
        role: input.role,
        content: input.content,
        model: input.model ?? null,
        tokens: input.tokens ?? 0,
        cost: input.cost ?? null,
        metadata: JSON.stringify(input.metadata ?? {}),
      })
      .returning();

    await db
      .update(chats)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(chats.id, input.chatId));

    return message;
  },

  async getMessages(chatId: string, opts?: { limit?: number; before?: string }) {
    const limit = opts?.limit ?? 100;
    return db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  },

  async updateTitle(id: string, title: string) {
    const [updated] = await db
      .update(chats)
      .set({ title, updatedAt: new Date().toISOString() })
      .where(eq(chats.id, id))
      .returning();
    return updated ?? null;
  },
};
