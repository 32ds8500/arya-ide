import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const repositories = sqliteTable('repositories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  path: text('path').notNull(),
  url: text('url'),
  branch: text('branch').default('main'),
  description: text('description'),
  language: text('language'),
  size: integer('size'),
  userId: text('user_id'),
  lastIndexedAt: integer('last_indexed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});
