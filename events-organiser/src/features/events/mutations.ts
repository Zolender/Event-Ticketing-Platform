"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendJson } from "@/lib/fetch-json";
import { venueKeys } from "../venues/queries";
import type { EventInput } from "./event-schema";
import { eventKeys } from "./queries";
import type { EventDetail } from "./types";

// Writes wait for the server (no optimistic flip): an organiser must never see "Published" for an
// event the server then refuses. Each success writes the server's answer into the cache and marks
// the lists stale (the venues page lists each venue's events too), so every screen shows the truth.

export function useSaveEvent(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EventInput) =>
      id
        ? sendJson<EventDetail>("PATCH", `/api/events/${id}`, input)
        : sendJson<{ id: string }>("POST", "/api/events", input),
    onSuccess: async (data) => {
      if (id)
        queryClient.setQueryData(eventKeys.detail(id), data as EventDetail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: eventKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: venueKeys.all }),
      ]);
    },
  });
}

export function useSetPublished(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publish: boolean) =>
      sendJson<EventDetail>(
        "POST",
        `/api/events/${id}/${publish ? "publish" : "unpublish"}`,
        {},
      ),
    onSuccess: async (event) => {
      queryClient.setQueryData(eventKeys.detail(id), event);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: eventKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: venueKeys.all }),
      ]);
    },
  });
}

export function useDeleteEvent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => sendJson<void>("DELETE", `/api/events/${id}`),
    // The deleted event's own cache entry is left to expire: removing it while its page is still
    // on screen would refetch it and flash a 404. Any later visit asks the server again anyway.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: eventKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: venueKeys.all }),
      ]),
  });
}
