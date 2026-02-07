import http from '@/lib/ky';
import type { ConversationTypes } from '@/types';

export class ConversationService {
  static async getConversations() {
    try {
      const res = await http.get('conversations');
      const data: ConversationTypes.Conversation[] = await res.json();
      console.log('Fetched conversations:', data);
      return data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw new Error('Failed to fetch conversations');
    }
  }
}
