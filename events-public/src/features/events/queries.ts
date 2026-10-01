import { infiniteQueryOptions } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch-json";
import type { EventPage } from "./types";

// Keys built in one place: every search is its own list in the cache, under eventKeys.lists().
export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (search: string | null) => [...eventKeys.lists(), { search }] as const,
};

/** Upcoming events a page at a time; `search` must already be normalised (null for none). */
export const upcomingEventsQuery = (search: string | null) =>
  infiniteQueryOptions({
    queryKey: eventKeys.list(search),
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (pageParam) params.set("cursor", pageParam);
      return fetchJson<EventPage>(`/api/events?${params}`, signal);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    // One quiet retry, then the page says it failed and offers Try again, rather than a long spinner.
    retry: 1,
  });
