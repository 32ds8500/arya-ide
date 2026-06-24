import { z } from 'zod';

export const createModelSchema = z.object({
  providerId: z.string().min(1),
  modelId: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  maxTokens: z.number().int().min(1).max(10000000).default(4096),
  inputPrice: z.number().min(0).default(0),
  outputPrice: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  isFree: z.boolean().default(false),
  capabilities: z.record(z.boolean()).optional(),
});

export const updateModelSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  maxTokens: z.number().int().min(1).max(10000000).optional(),
  inputPrice: z.number().min(0).optional(),
  outputPrice: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  isFree: z.boolean().optional(),
  capabilities: z.record(z.boolean()).optional(),
});

export type CreateModelInput = z.infer<typeof createModelSchema>;
export type UpdateModelInput = z.infer<typeof updateModelSchema>;
