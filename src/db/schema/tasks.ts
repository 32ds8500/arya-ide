import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  planId: text('plan_id'),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'),
  assignedAgent: text('assigned_agent'),
  dependencies: text('dependencies'),
  result: text('result'),
  error: text('error'),
  estimatedDuration: integer('estimated_duration'),
  actualDuration: integer('actual_duration'),
  parentId: text('parent_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' })
});
