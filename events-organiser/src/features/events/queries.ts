import { queryOptions } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch-json";
import type { EventDetail, EventSummary } from "./types";

// Keys built in one place, so invalidating `eventKeys.all` or `eventKeys.lists()` reaches every
// matching query. One list for all of an organiser's events: tabs are views of it.
export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  detail: (id: string) => [...eventKeys.all, "detail", id] as const,
};

export const myEventsQuery = () =>
  queryOptions({
    queryKey: eventKeys.lists(),
    queryFn: () => fetchJson<EventSummary[]>("/api/events"),
  });

export const myEventQuery = (id: string) =>
  queryOptions({
    queryKey: eventKeys.detail(id),
    queryFn: () => fetchJson<EventDetail>(`/api/events/${id}`),
  });
