import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { OperatorProvider } from "@/features/operator-session";
import { ThemeProvider } from "@/features/theme";

export function AppProviders({ children }: { children: ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5000,
						refetchOnWindowFocus: true,
						retry: 1,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				<OperatorProvider>{children}</OperatorProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
