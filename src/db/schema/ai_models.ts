import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const aiModels = sqliteTable('ai_models', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  providerId: text('provider_id').notNull(),
  modelId: text('model_id').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  maxTokens: integer('max_tokens').notNull().default(4096),
  inputPrice: real('input_price').notNull().default(0),
  outputPrice: real('output_price').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  isFree: integer('is_free', { mode: 'boolean' }).notNull().default(false),
  capabilities: text('capabilities'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
