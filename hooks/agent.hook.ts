import type { AgentRegisterData } from '@/schemas';
import { AgentService } from '@/services';
import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

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

type UseRegisterAgentResult = {
  registerAgent: (payload: Parameters<typeof AgentService.registerAgent>[0]) => void;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  isSuccess: boolean;
};

export const useRegisterAgent = (): UseRegisterAgentResult => {
  const queryClient = useQueryClient();

  const { mutate, isPending, isError, isSuccess, error } = useMutation({
    mutationFn: (newAgent: AgentRegisterData) => AgentService.registerAgent(newAgent),
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
