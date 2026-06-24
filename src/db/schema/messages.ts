import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { chats } from './chats';

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  chatId: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  content: text('content').notNull(),
  model: text('model'),
  tokens: integer('tokens'),
  cost: real('cost'),
  metadata: text('metadata'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
