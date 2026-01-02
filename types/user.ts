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
  _id: string;
  agentName: string;
  agentEmail: string;
  handleBy: string;
  orgId: string;
  role: 'admin' | 'agent';
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
};
