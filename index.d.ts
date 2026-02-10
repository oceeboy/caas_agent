declare module '@/services' {
  export function login(data: LoginData): Promise<LoginResponse>;
  export function fetchUserDetails(): Promise<AuthUser>;
  export function refreshToken(): Promise<RefreshTokenResponse>;
  export function getNewAccessToken(refreshToken: string): Promise<string | null>;
  export class AgentAuthService {
    static loginAgentDetails(data: AgentLoginData): Promise<AgentLoginResponse>;
  }
  export class ConversationService {
    static getConversations(): Promise<Conversation[]>;
    static joinConversation(
      joinConversationData: JoinConversationData,
    ): Promise<JoinConversationResponse>;
  }
  export class AgentService {
    static getAgents(): Promise<Agent[]>;
    static registerAgent(newAgent: AgentRegisterData): Promise<Agent>;
    static startAgentSession(agentId: { agentId: string }): Promise<AgentSessionResponse>;
  }
}
