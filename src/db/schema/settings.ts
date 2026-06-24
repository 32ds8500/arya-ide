import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  key: text('key').notNull(),
  value: text('value'),
  category: text('category').default('general'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});
