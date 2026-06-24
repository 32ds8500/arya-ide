import { eq, desc, and, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { logs } from "@/db/schema";
import { generateId } from "@/utils/crypto";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  error?: Error;
  userId?: string;
  projectId?: string;
  requestId?: string;
}

function serializeError(error: Error) {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}

export const logService = {
  async info(context: string, data?: unknown) {
    await this.write({ level: "info", message: context, data });
  },

  async warn(context: string, data?: unknown) {
    await this.write({ level: "warn", message: context, data });
  },

  async error(context: string, error: Error, data?: unknown) {
    await this.write({ level: "error", message: context, error, data });
  },

  async debug(context: string, data?: unknown) {
    if (process.env.NODE_ENV !== "production") {
      await this.write({ level: "debug", message: context, data });
    }
  },

  async audit(action: string, data?: Record<string, unknown>) {
    await this.write({
      level: "info",
      context: "audit",
      message: action,
      data: { ...data, audit: true, timestamp: new Date().toISOString() },
    });
  },

  async write(entry: LogEntry) {
    const logEntry = {
      action: entry.level,
      resource: entry.context ?? "app",
      metadata: JSON.stringify({
        level: entry.level,
        message: entry.message,
        data: entry.data ?? {},
        error: entry.error ? serializeError(entry.error) : null,
        requestId: entry.requestId ?? null,
      }),
      userId: entry.userId ?? null,
      resourceId: entry.projectId ?? null,
    };

    if (process.env.NODE_ENV !== "production") {
      const color = { info: "\x1b[36m", warn: "\x1b[33m", error: "\x1b[31m", debug: "\x1b[90m" };
      console.log(
        `${color[entry.level]}[${entry.level.toUpperCase()}]\x1b[0m ${entry.message}`,
        entry.data ? JSON.stringify(entry.data) : ""
      );
    }

    try {
      await db.insert(logs).values(logEntry);
    } catch {
      console.error("Failed to write log to database");
    }
  },

  async query(opts: {
    level?: LogLevel;
    context?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const conditions = [];
    if (opts.startDate) conditions.push(gte(logs.createdAt, opts.startDate.toISOString()));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db
      .select()
      .from(logs)
      .where(whereClause)
      .orderBy(desc(logs.createdAt))
      .limit(opts.limit ?? 100)
      .offset(opts.offset ?? 0);
  },

  async cleanup(daysOld: number = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const { lt } = await import("drizzle-orm");
    const deleted = await db
      .delete(logs)
      .where(lt(logs.createdAt, cutoff.toISOString()))
      .returning();

    return { deletedCount: deleted.length };
  },
};
