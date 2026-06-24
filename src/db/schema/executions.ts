import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const executions = sqliteTable('executions', {
  id: text('id').primaryKey(),
  agentId: text('agent_id'),
  taskId: text('task_id'),
  toolName: text('tool_name').notNull(),
  input: text('input'),
  output: text('output'),
  error: text('error'),
  status: text('status').notNull().default('pending'),
  duration: integer('duration'),
  tokensUsed: integer('tokens_used'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' })
});
