import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			// Default staleTime: 30s — prevents mass re-fetching on every navigation.
			// Individual queries can override with their own staleTime.
			staleTime: 30 * 1000,
		},
	},
});