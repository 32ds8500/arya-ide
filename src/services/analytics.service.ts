import { sql, eq, and, gte, lte, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { analytics } from "@/db/schema";
import { generateId } from "@/utils/crypto";

export interface TrackEventInput {
  event: string;
  properties?: Record<string, unknown>;
  userId?: string;
}

export interface StatsQuery {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

export const analyticsService = {
  async track(input: TrackEventInput) {
    const id = generateId();
    await db.insert(analytics).values({
      id,
      event: input.event,
      properties: JSON.stringify(input.properties ?? {}),
      userId: input.userId ?? null,
    });

    return { id, event: input.event };
  },

  async getStats(query: StatsQuery) {
    const conditions = [];
    if (query.userId) conditions.push(eq(analytics.userId, query.userId));
    if (query.startDate) conditions.push(gte(analytics.createdAt, query.startDate.toISOString()));
    if (query.endDate) conditions.push(lte(analytics.createdAt, query.endDate.toISOString()));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalEvents] = await db
      .select({ value: sql<number>`count(*)` })
      .from(analytics)
      .where(whereClause);

    const [uniqueUsers] = await db
      .select({ value: sql<number>`count(distinct ${analytics.userId})` })
      .from(analytics)
      .where(whereClause);

    const topEvents = await db
      .select({
        event: analytics.event,
        count: sql<number>`count(*)`,
      })
      .from(analytics)
      .where(whereClause)
      .groupBy(analytics.event)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    return {
      totalEvents: totalEvents?.value ?? 0,
      uniqueUsers: uniqueUsers?.value ?? 0,
      topEvents,
    };
  },

  async getModelUsage(query: StatsQuery) {
    const conditions = [eq(analytics.event, "ai.chat")];
    if (query.userId) conditions.push(eq(analytics.userId, query.userId));
    if (query.startDate) conditions.push(gte(analytics.createdAt, query.startDate.toISOString()));
    if (query.endDate) conditions.push(lte(analytics.createdAt, query.endDate.toISOString()));

    return db
      .select({
        model: sql<string>`(${analytics.properties} ->> 'model')`,
        count: sql<number>`count(*)`,
        totalTokens: sql<number>`sum((${analytics.properties} ->> 'tokens')::int)`,
      })
      .from(analytics)
      .where(and(...conditions))
      .groupBy(sql`(${analytics.properties} ->> 'model')`)
      .orderBy(desc(sql`count(*)`));
  },

  async getTokenUsage(query: StatsQuery) {
    const conditions = [eq(analytics.event, "ai.chat")];
    if (query.userId) conditions.push(eq(analytics.userId, query.userId));
    if (query.startDate) conditions.push(gte(analytics.createdAt, query.startDate.toISOString()));
    if (query.endDate) conditions.push(lte(analytics.createdAt, query.endDate.toISOString()));

    const [result] = await db
      .select({
        totalTokens: sql<number>`coalesce(sum((${analytics.properties} ->> 'tokens')::int), 0)`,
        avgTokens: sql<number>`coalesce(avg((${analytics.properties} ->> 'tokens')::int), 0)`,
        requestCount: sql<number>`count(*)`,
      })
      .from(analytics)
      .where(and(...conditions));

    return result ?? { totalTokens: 0, avgTokens: 0, requestCount: 0 };
  },

  async getCostReport(query: StatsQuery) {
    const conditions = [eq(analytics.event, "ai.chat")];
    if (query.userId) conditions.push(eq(analytics.userId, query.userId));
    if (query.startDate) conditions.push(gte(analytics.createdAt, query.startDate.toISOString()));
    if (query.endDate) conditions.push(lte(analytics.createdAt, query.endDate.toISOString()));

    const byModel = await db
      .select({
        model: sql<string>`(${analytics.properties} ->> 'model')`,
        totalCost: sql<number>`coalesce(sum((${analytics.properties} ->> 'cost')::numeric), 0)`,
        requestCount: sql<number>`count(*)`,
        totalTokens: sql<number>`coalesce(sum((${analytics.properties} ->> 'tokens')::int), 0)`,
      })
      .from(analytics)
      .where(and(...conditions))
      .groupBy(sql`(${analytics.properties} ->> 'model')`)
      .orderBy(desc(sql`coalesce(sum((${analytics.properties} ->> 'cost')::numeric), 0)`));

    const [totals] = await db
      .select({
        totalCost: sql<number>`coalesce(sum((${analytics.properties} ->> 'cost')::numeric), 0)`,
        totalTokens: sql<number>`coalesce(sum((${analytics.properties} ->> 'tokens')::int), 0)`,
        requestCount: sql<number>`count(*)`,
      })
      .from(analytics)
      .where(and(...conditions));

    return {
      byModel,
      totals: totals ?? { totalCost: 0, totalTokens: 0, requestCount: 0 },
    };
  },
};
