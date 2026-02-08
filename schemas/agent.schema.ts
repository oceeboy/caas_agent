import { z } from 'zod';
const agentRegisterSchema = z.object({
  agentEmail: z.string().email('Invalid email address'),
  agentName: z.string().min(2, 'Name must be at least 2 characters'),
});

export { agentRegisterSchema };
export type AgentRegisterData = z.infer<typeof agentRegisterSchema>;
