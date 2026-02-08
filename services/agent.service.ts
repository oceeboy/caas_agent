import http from '@/lib/ky';
import type { AgentRegisterData } from '@/schemas';
import type { AgentTypes } from '@/types';
import { HTTPError } from 'ky';

export class AgentService {
  constructor() {}
  private static async parseErrorResponse(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as AgentTypes.ErrorResponse;
      if (Array.isArray(body.message)) {
        return body.message.join(', ');
      }
      return body.message ?? `Request failed with status ${response.status}`;
    } catch {
      return `Request failed with status ${response.status} (invalid error response)`;
    }
  }

  static async getAgents() {
    try {
      const res = await http.get('agent');
      const data: AgentTypes.Agent[] = await res.json();
      console.log('Fetched agents:', data);
      return data;
    } catch (error) {
      if (error instanceof HTTPError) {
        const message = await this.parseErrorResponse(error.response);
        throw new Error(message);
      }
      throw new Error(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while fetching agents.',
      );
    }
  }

  static async registerAgent({ agentEmail, agentName }: AgentRegisterData) {
    try {
      const res = await http.post('agent/register', {
        json: { agentEmail, agentName },
      });
      const data: AgentTypes.RegisterAgentResponse = await res.json();
      console.log('Registered agent:', data);
      return data;
    } catch (error) {
      if (error instanceof HTTPError) {
        const message = await this.parseErrorResponse(error.response);
        throw new Error(message);
      }
      throw new Error(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while registering agent.',
      );
    }
  }
}
