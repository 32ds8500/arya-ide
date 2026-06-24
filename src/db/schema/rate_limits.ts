import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const rateLimits = sqliteTable('rate_limits', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: text('key').notNull().unique(),
  count: integer('count').notNull().default(0),
  windowStart: text('window_start').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
