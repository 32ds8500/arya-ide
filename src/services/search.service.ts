import { sql, eq, and, or, like, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { files, chats, messages } from "@/db/schema";

export interface SearchResult {
  id: string;
  type: "file" | "chat" | "message" | "code";
  title: string;
  content: string;
  path?: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface SearchOptions {
  projectId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
  type?: "file" | "chat" | "message" | "code";
}

export const searchService = {
  async fullTextSearch(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const limit = options?.limit ?? 50;

    if (!options?.type || options.type === "file") {
      const fileResults = await db
        .select({
          id: files.id,
          name: files.name,
          path: files.path,
          content: files.content,
        })
        .from(files)
        .where(
          and(
            options?.projectId ? eq(files.projectId, options.projectId) : sql`true`,
            or(like(files.name, `%${query}%`), like(files.content, `%${query}%`))
          )
        )
        .limit(limit);

      for (const file of fileResults) {
        const snippet = this.extractSnippet(file.content ?? "", query);
        results.push({
          id: file.id,
          type: "file",
          title: file.name,
          content: snippet,
          path: file.path ?? undefined,
          score: this.calculateRelevance(file.name, file.content ?? "", query),
        });
      }
    }

    if (!options?.type || options.type === "chat") {
      const chatResults = await db
        .select()
        .from(chats)
        .where(
          and(
            options?.projectId ? eq(chats.projectId, options.projectId) : sql`true`,
            like(chats.title, `%${query}%`)
          )
        )
        .limit(limit);

      for (const chat of chatResults) {
        results.push({
          id: chat.id,
          type: "chat",
          title: chat.title ?? "",
          content: "",
          score: this.calculateRelevance(chat.title ?? "", "", query),
        });
      }
    }

    if (!options?.type || options.type === "message") {
      const messageResults = await db
        .select()
        .from(messages)
        .where(like(messages.content, `%${query}%`))
        .limit(limit);

      for (const msg of messageResults) {
        const snippet = this.extractSnippet(msg.content, query);
        results.push({
          id: msg.id,
          type: "message",
          title: `${msg.role} message`,
          content: snippet,
          score: this.calculateRelevance("", msg.content, query),
          metadata: { role: msg.role },
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  },

  async semanticSearch(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(/\s+/).filter(Boolean);

    const allFiles = await db
      .select()
      .from(files)
      .where(options?.projectId ? eq(files.projectId, options.projectId) : sql`true`)
      .limit(500);

    const scored: SearchResult[] = [];

    for (const file of allFiles) {
      const nameScore = keywords.reduce(
        (score, kw) => score + (file.name.toLowerCase().includes(kw) ? 2 : 0),
        0
      );
      const contentScore = keywords.reduce(
        (score, kw) =>
          score + ((file.content ?? "").toLowerCase().split(kw).length - 1),
        0
      );

      if (nameScore + contentScore > 0) {
        scored.push({
          id: file.id,
          type: "file",
          title: file.name,
          content: this.extractSnippet(file.content ?? "", query),
          path: file.path ?? undefined,
          score: nameScore + contentScore,
        });
      }
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, options?.limit ?? 50);
  },

  async searchFiles(query: string, projectId: string) {
    const results = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.projectId, projectId),
          or(like(files.name, `%${query}%`), like(files.path, `%${query}%`))
        )
      )
      .orderBy(desc(files.updatedAt))
      .limit(50);

    return results.map((file) => ({
      id: file.id,
      name: file.name,
      path: file.path,
      mimeType: file.mimeType,
      size: file.size,
      updatedAt: file.updatedAt,
    }));
  },

  async searchCode(query: string, projectId?: string, language?: string) {
    const results = await db
      .select()
      .from(files)
      .where(
        and(
          projectId ? eq(files.projectId, projectId) : sql`true`,
          like(files.content, `%${query}%`)
        )
      )
      .limit(100);

    const matches: {
      fileId: string;
      fileName: string;
      filePath: string;
      line: number;
      content: string;
    }[] = [];

    for (const file of results) {
      const lines = (file.content ?? "").split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(query.toLowerCase())) {
          matches.push({
            fileId: file.id,
            fileName: file.name,
            filePath: file.path ?? "",
            line: i + 1,
            content: lines[i].trim(),
          });
        }
      }
    }

    return matches;
  },

  extractSnippet(content: string, query: string, contextLength: number = 100): string {
    const lower = content.toLowerCase();
    const idx = lower.indexOf(query.toLowerCase());

    if (idx === -1) return `${content.slice(0, contextLength * 2)  }...`;

    const start = Math.max(0, idx - contextLength);
    const end = Math.min(content.length, idx + query.length + contextLength);
    let snippet = content.slice(start, end);

    if (start > 0) snippet = `...${  snippet}`;
    if (end < content.length) snippet = `${snippet  }...`;

    return snippet;
  },

  calculateRelevance(title: string, content: string, query: string): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    if (title.toLowerCase() === queryLower) score += 100;
    if (title.toLowerCase().includes(queryLower)) score += 50;

    const contentMatches = content.toLowerCase().split(queryLower).length - 1;
    score += Math.min(contentMatches * 10, 50);

    return score;
  },
};
