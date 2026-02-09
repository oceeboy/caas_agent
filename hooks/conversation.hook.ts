import type { JoinConversationData } from '@/schemas';
import { ConversationService } from '@/services';
import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

type UseConversationsResult = {
  conversations: Awaited<ReturnType<typeof ConversationService.getConversations>> | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  refetch: () => void;
};

export const useConversations = (): UseConversationsResult => {
  const {
    data,
    error,
    isLoading,
    isError,
    refetch,
  }: UseQueryResult<
    Awaited<ReturnType<typeof ConversationService.getConversations>>,
    unknown
  > = useQuery({
    queryKey: ['useConversations'],
    queryFn: () => ConversationService.getConversations(),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    retry: 1,
  });

  const errorMessage =
    isError && error ? (error instanceof Error ? error.message : String(error)) : null;

  return {
    conversations: data,
    isLoading,
    isError,
    errorMessage,
    refetch,
  };
};

export const useJoinConversation = () => {
  const queryClient = useQueryClient();
  const { mutate, isPending, isError, isSuccess, error } = useMutation<
    Awaited<ReturnType<typeof ConversationService.joinConversation>>,
    unknown,
    JoinConversationData
  >({
    mutationFn: (joinConversationData) =>
      ConversationService.joinConversation(joinConversationData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['useConversations'] });
    },
  });

  const errorMessage =
    isError && error ? (error instanceof Error ? error.message : String(error)) : null;

  return {
    joinConversation: mutate,
    isJoining: isPending,
    isError,
    errorMessage,
    isSuccess,
  };
};
