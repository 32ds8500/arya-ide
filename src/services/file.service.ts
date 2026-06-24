import { eq, like, desc, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { files } from "@/db/schema";
import { generateId } from "@/utils/crypto";
import { getExtension, getMimeType, joinPath, normalizePath } from "@/utils/file";
import * as fs from "fs/promises";
import * as path from "path";

export interface CreateFileInput {
  projectId: string;
  name: string;
  path: string;
  content?: string;
  isDirectory?: boolean;
  parentId?: string;
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
}

export const fileService = {
  async create(input: CreateFileInput) {
    const id = generateId();
    const ext = getExtension(input.name);
    const [file] = await db
      .insert(files)
      .values({
        id,
        projectId: input.projectId,
        name: input.name,
        path: normalizePath(input.path),
        content: input.content ?? "",
        mimeType: getMimeType(input.name),
        type: input.isDirectory ? "folder" : "file",
        parentId: input.parentId ?? null,
        size: Buffer.byteLength(input.content ?? ""),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    return file;
  },

  async read(id: string) {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file ?? null;
  },

  async readByPath(projectId: string, filePath: string) {
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.projectId, projectId), eq(files.path, normalizePath(filePath))));
    return file ?? null;
  },

  async update(id: string, data: Partial<typeof files.$inferInsert>) {
    const [updated] = await db
      .update(files)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(files.id, id))
      .returning();
    return updated ?? null;
  },

  async delete(id: string) {
    const [deleted] = await db
      .delete(files)
      .where(eq(files.id, id))
      .returning();
    return deleted ?? null;
  },

  async list(projectId: string, parentId?: string) {
    const conditions = parentId
      ? and(eq(files.projectId, projectId), eq(files.parentId, parentId))
      : eq(files.projectId, projectId);
    return db.select().from(files).where(conditions).orderBy(files.name);
  },

  async search(projectId: string, query: string) {
    return db
      .select()
      .from(files)
      .where(and(eq(files.projectId, projectId), like(files.name, `%${query}%`)))
      .orderBy(desc(files.updatedAt))
      .limit(50);
  },

  async getContent(id: string) {
    const file = await this.read(id);
    return file?.content ?? null;
  },

  async saveContent(id: string, content: string) {
    return this.update(id, {
      content,
      size: Buffer.byteLength(content),
    });
  },

  async getTree(projectId: string): Promise<FileTreeNode[]> {
    const allFiles = await db
      .select()
      .from(files)
      .where(eq(files.projectId, projectId))
      .orderBy(files.path);

    const map = new Map<string, FileTreeNode>();
    const roots: FileTreeNode[] = [];

    for (const file of allFiles) {
      map.set(file.id, {
        id: file.id,
        name: file.name,
        path: file.path,
        isDirectory: file.type === "folder",
        children: file.type === "folder" ? [] : undefined,
      });
    }

    for (const file of allFiles) {
      const node = map.get(file.id)!;
      if (file.parentId && map.has(file.parentId)) {
        map.get(file.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  },

  async move(id: string, newPath: string, newParentId?: string) {
    const file = await this.read(id);
    if (!file) return null;

    if (file.type === "folder") {
      const descendants = await db
        .select()
        .from(files)
        .where(like(files.path, `${file.path}%`));

      const oldPath = file.path;
      for (const desc of descendants) {
        const updatedPath = desc.path.replace(oldPath, normalizePath(newPath));
        await db
          .update(files)
          .set({ path: updatedPath, updatedAt: new Date().toISOString() })
          .where(eq(files.id, desc.id));
      }
    }

    return this.update(id, {
      path: normalizePath(newPath),
      parentId: newParentId ?? file.parentId,
    });
  },

  async copy(id: string, destPath: string, destProjectId?: string) {
    const file = await this.read(id);
    if (!file) return null;

    return this.create({
      projectId: destProjectId ?? file.projectId,
      name: file.name,
      path: destPath,
      content: file.content ?? undefined,
      isDirectory: file.type === "folder",
      parentId: file.parentId ?? undefined,
    });
  },
};
