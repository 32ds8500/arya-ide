import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const plans = sqliteTable('plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  goal: text('goal').notNull(),
  status: text('status').notNull().default('draft'),
  tasksJson: text('tasks_json'),
  milestonesJson: text('milestones_json'),
  checkpointsJson: text('checkpoints_json'),
  repositoryId: text('repository_id'),
  userId: text('user_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' })
});
