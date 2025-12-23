import { fetchUserDetails } from '@/services';
import { useQuery } from '@tanstack/react-query';

export const useUserInfo = () => {
  const {
    data: user,
    error,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchUserDetails,
    refetchOnWindowFocus: false, // do not refetch on window focus
    staleTime: Infinity, // data stays fresh until explicitly invalidated
    retry: 1, // retry once on failure
  });

  // Map error to a string message for easier consumption
  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null;

  return { user, errorMessage, isLoading, isError, refetch };
};
