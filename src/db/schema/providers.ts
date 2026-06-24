import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const providers = sqliteTable('providers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  baseUrl: text('base_url'),
  apiKeyRequired: integer('api_key_required', { mode: 'boolean' }).notNull().default(false),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  config: text('config'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
