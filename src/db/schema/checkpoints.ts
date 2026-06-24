import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const checkpoints = sqliteTable('checkpoints', {
  id: text('id').primaryKey(),
  planId: text('plan_id').notNull(),
  taskId: text('task_id'),
  state: text('state').notNull(),
  data: text('data'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});
