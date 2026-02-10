import type { AgentRegisterData } from '@/schemas';
import { AgentService } from '@/services';
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
  type Mutation,
} from '@tanstack/react-query';

type UseAgentsResult = {
  agents: Awaited<ReturnType<typeof AgentService.getAgents>> | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  refetch: () => void;
};

export const useAgents = (): UseAgentsResult => {
  const {
    data,
    error,
    isLoading,
    isError,
    refetch,
  }: UseQueryResult<Awaited<ReturnType<typeof AgentService.getAgents>>, unknown> = useQuery({
    queryKey: ['useAgents'],
    queryFn: () => AgentService.getAgents(),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    retry: 1,
  });

  const errorMessage =
    isError && error ? (error instanceof Error ? error.message : String(error)) : null;

  return {
    agents: data,
    isLoading,
    isError,
    errorMessage,
    refetch,
  };
};

// registerAgent

export const useRegisterAgent = () => {
  const queryClient = useQueryClient();

  const { mutate, isPending, isError, isSuccess, error } = useMutation<
    Awaited<ReturnType<typeof AgentService.registerAgent>>,
    unknown,
    AgentRegisterData
  >({
    mutationFn: (newAgent) => AgentService.registerAgent(newAgent),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['useAgents'] });
    },
  });

  const errorMessage =
    isError && error ? (error instanceof Error ? error.message : String(error)) : null;

  return {
    registerAgent: mutate,
    isLoading: isPending,
    isError,
    errorMessage,
    isSuccess,
  };
};

export const useStartAgentSession = () => {
  const queryClient = useQueryClient();
  const { mutate, isPending, isError, isSuccess, error } = useMutation<
    Awaited<ReturnType<typeof AgentService.startAgentSession>>,
    unknown,
    { agentId: string }
  >({
    mutationFn: (agentId) => AgentService.startAgentSession(agentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['useAgents'] }),
        queryClient.invalidateQueries({ queryKey: ['useConversations'] }),
      ]);
    },
  });

  const errorMessage =
    isError && error ? (error instanceof Error ? error.message : String(error)) : null;
  return {
    startSessiont: mutate,
    isLoading: isPending,
    isError,
    errorMessage,
    isSuccess,
  };
};
