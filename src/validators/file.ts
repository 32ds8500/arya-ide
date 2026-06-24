import { z } from 'zod';

export const createFileSchema = z.object({
  name: z.string().min(1, 'File name is required').max(255),
  content: z.string().optional().default(''),
  type: z.enum(['file', 'folder']),
  parentId: z.string().uuid().nullable().optional(),
});

export const updateFileSchema = z.object({
  content: z.string().optional(),
  name: z.string().min(1).max(255).optional(),
});

export type CreateFileInput = z.infer<typeof createFileSchema>;
export type UpdateFileInput = z.infer<typeof updateFileSchema>;
