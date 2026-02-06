import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: () => {
        // Default query function
      },
    },
  },
});

export { queryClient };
