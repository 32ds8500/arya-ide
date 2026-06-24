import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { projects } from './projects';
import { files } from './files';

export const vectorEmbeddings = sqliteTable('vector_embeddings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  fileId: text('file_id').references(() => files.id, { onDelete: 'set null' }),
  chunk: text('chunk').notNull(),
  embedding: text('embedding').notNull(),
  metadata: text('metadata'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
