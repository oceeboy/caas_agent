import { AgentService } from '@/services';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

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
