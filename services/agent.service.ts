import http from '@/lib/ky';
import type { AgentTypes } from '@/types';

export class AgentService {
  static async getAgents() {
    try {
      const res = await http.get('agent');
      const data: AgentTypes.Agent[] = await res.json();
      console.log('Fetched agents:', data);
      return data;
    } catch (e) {
      console.error('Error fetching agents:', e);
      throw e;
    }
  }
}
