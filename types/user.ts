export type User = {
  _id: string;
  name: string;
  email: string;
  orgId: string;
  role: 'admin' | 'agent';
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
};

export type AgentUser = {
  agentId: string;
  agentName: string;
  agentEmail: string;
  role: string;
};
