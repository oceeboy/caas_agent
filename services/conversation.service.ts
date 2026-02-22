import http from '@/lib/ky';
import type { JoinConversationData } from '@/schemas';

import type { ConversationTypes } from '@/types';
import { HTTPError } from 'ky';

export class ConversationService {
  private static async parseErrorResponse(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as ConversationTypes.ErrorResponse;
      if (Array.isArray(body.message)) {
        return body.message.join(', ');
      }
      return body.message ?? `Request failed with status ${response.status}`;
    } catch {
      return `Request failed with status ${response.status} (invalid error response)`;
    }
  }

  static async getConversations() {
    try {
      const res = await http.get('conversations');
      const data: ConversationTypes.Conversation[] = await res.json();
      console.log('Fetched conversations:', data);
      return data;
    } catch (error) {
      if (error instanceof HTTPError) {
        const message = await this.parseErrorResponse(error.response);
        throw new Error(message);
      }
      throw new Error(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while fetching conversations.',
      );
    }
  }

  static async joinConversation({ agentId, conversationId }: JoinConversationData) {
    // implement join conversation logic here
    try {
      const res = await http.post('conversations/join', {
        json: { agentId, conversationId },
      });
      const data: ConversationTypes.JoinConversationResponse = await res.json();
      console.log('Join conversation response', data);
      return data;
    } catch (error) {
      if (error instanceof HTTPError) {
        const message = await this.parseErrorResponse(error.response);
        throw new Error(message);
      }
      throw new Error(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while joining conversations.',
      );
    }
  }

  static async getConversationById({ conversationId }: { conversationId: string }) {
    try {
      const res = await http.get(`conversations/${conversationId}`);
      const data: ConversationTypes.Conversation = await res.json();
      console.log('Fetched conversation:', data);
      return data;
    } catch (error) {
      if (error instanceof HTTPError) {
        const message = await this.parseErrorResponse(error.response);
        throw new Error(message);
      }
      throw new Error(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while fetching the conversation.',
      );
    }
  }
}
