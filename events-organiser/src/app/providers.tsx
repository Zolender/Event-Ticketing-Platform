"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { SessionEndedError } from "@/lib/fetch-json";
import { getQueryClient } from "@/lib/query-client";

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  const router = useRouter();

  // Any query or write that finds the session ended sends the organiser back to sign-in, cache
  // cleared.
  useEffect(() => {
    const ended = () => {
      queryClient.clear();
      router.replace("/sign-in?reason=session-ended");
    };
    const stopQueries = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        event.action.type === "error" &&
        event.action.error instanceof SessionEndedError
      )
        ended();
    });
    const stopMutations = queryClient.getMutationCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        event.action.type === "error" &&
        event.action.error instanceof SessionEndedError
      )
        ended();
    });
    return () => {
      stopQueries();
      stopMutations();
    };
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Left out of production builds by the package itself. */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
