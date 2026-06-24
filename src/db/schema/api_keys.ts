import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  key: text('key').notNull().unique(),
  permissions: text('permissions').notNull().default('[]'),
  expiresAt: text('expires_at'),
  lastUsedAt: text('last_used_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
