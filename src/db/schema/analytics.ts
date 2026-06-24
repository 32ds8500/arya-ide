import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const analytics = sqliteTable('analytics', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  event: text('event').notNull(),
  properties: text('properties'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
