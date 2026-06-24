import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { projects } from './projects';

export const files = sqliteTable('files', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'),
  name: text('name').notNull(),
  path: text('path').notNull(),
  content: text('content'),
  type: text('type').notNull().default('file'),
  mimeType: text('mime_type'),
  size: integer('size'),
  language: text('language'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});
