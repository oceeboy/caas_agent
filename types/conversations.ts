export interface Conversation {
  conversationId: string;
  status: ConversationStatus;
  visitorId: string;
  agentId?: string | null;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export type ConversationStatus = 'pending' | 'open' | 'closed';
