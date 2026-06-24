import { z } from 'zod';

export const createChatSchema = z.object({
  title: z.string().max(255).optional(),
  projectId: z.string().uuid().nullable().optional(),
  modelId: z.string().max(255).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(100000),
  attachments: z.array(z.object({
    name: z.string(),
    type: z.string(),
    content: z.string(),
  })).max(5).optional(),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
