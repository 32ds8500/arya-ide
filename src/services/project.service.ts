import { eq, desc, sql, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, files, chats } from "@/db/schema";
import { generateId } from "@/utils/crypto";

export interface CreateProjectInput {
  name: string;
  description?: string;
  template?: string;
  userId: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

export const projectService = {
  async create(input: CreateProjectInput) {
    const id = generateId();
    const [project] = await db
      .insert(projects)
      .values({
        id,
        name: input.name,
        description: input.description,
        template: (input.template ?? "blank") as "blank" | "react" | "next" | "node" | "python",
        userId: input.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    return project;
  },

  async getById(id: string) {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project ?? null;
  },

  async list(userId: string, opts?: { limit?: number; offset?: number }) {
    const limit = opts?.limit ?? 50;
    const offset = opts?.offset ?? 0;
    return db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt))
      .limit(limit)
      .offset(offset);
  },

  async update(id: string, input: UpdateProjectInput) {
    const [updated] = await db
      .update(projects)
      .set({ ...input, updatedAt: new Date().toISOString() })
      .where(eq(projects.id, id))
      .returning();
    return updated ?? null;
  },

  async delete(id: string) {
    const [deleted] = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();
    return deleted ?? null;
  },

  async duplicate(id: string, userId: string) {
    const original = await this.getById(id);
    if (!original) return null;

    const newId = generateId();
    const [duplicate] = await db
      .insert(projects)
      .values({
        id: newId,
        name: `${original.name} (Copy)`,
        description: original.description,
        template: original.template,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    return duplicate;
  },

  async getStats(id: string) {
    const [fileCount] = await db
      .select({ value: count() })
      .from(files)
      .where(eq(files.projectId, id));

    const [chatCount] = await db
      .select({ value: count() })
      .from(chats)
      .where(eq(chats.projectId, id));

    return {
      fileCount: fileCount?.value ?? 0,
      chatCount: chatCount?.value ?? 0,
    };
  },
};
