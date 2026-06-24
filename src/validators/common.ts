import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchSchema = z.object({
  query: z.string().min(1).max(500),
});

export const idSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type IdInput = z.infer<typeof idSchema>;
