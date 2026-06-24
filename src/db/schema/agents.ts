import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  name: text('name').notNull(),
  status: text('status').notNull().default('idle'),
  config: text('config'),
  model: text('model'),
  provider: text('provider'),
  result: text('result'),
  error: text('error'),
  stepsCount: integer('steps_count').default(0),
  tokensUsed: integer('tokens_used').default(0),
  duration: integer('duration'),
  sessionId: text('session_id'),
  parentId: text('parent_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' })
});
