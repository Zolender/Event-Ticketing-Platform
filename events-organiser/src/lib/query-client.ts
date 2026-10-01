import { environmentManager, QueryClient } from "@tanstack/react-query";
import { SessionEndedError } from "./fetch-json";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Above zero so data prefetched on the server is not fetched again straight away.
        staleTime: 60 * 1000,
        // An ended session will not come back by retrying.
        retry: (failures, error) =>
          !(error instanceof SessionEndedError) && failures < 3,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** A new client per request on the server (users never share a cache), one per page in the browser. */
export function getQueryClient() {
  if (environmentManager.isServer()) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
