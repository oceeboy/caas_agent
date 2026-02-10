export type Agent = {
  agentId: string;
  agentName: string;
  agentEmail: string;
  role: string;
};

export type RegisterAgentResponse = {
  message: string;
  agentId: string;
};

export type ErrorResponse = {
  message: string;
  error: string;
  statusCode: number;
};

export type AgentSessionResponse = {
  agent: Agent;
  token: string;
  expiresIn: number;
  message: string;
};
