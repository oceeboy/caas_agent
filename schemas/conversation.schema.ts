import { z } from 'zod';

export const joinConversationSchema = z.object({
  agentId: z.string(),
  conversationId: z.string(),
});

export type JoinConversationData = z.infer<typeof joinConversationSchema>;
