"use client";

import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { sendJson } from "@/lib/fetch-json";
import { eventKeys } from "../events/queries";
import { venueKeys } from "./queries";
import type { VenueInput } from "./venue-schema";

// A venue change reaches its events too (their place, and their instants when the zone moves),
// so every venue write marks both the venues and the events stale.
function refresh(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: venueKeys.all }),
    queryClient.invalidateQueries({ queryKey: eventKeys.all }),
  ]);
}

function useRefresh() {
  const queryClient = useQueryClient();
  return () => refresh(queryClient);
}

/**
 * Undo for a deleted venue: it is created again as it was (nothing pointed to it, so a copy is the
 * same venue). A plain function, because its row has already left the screen when Undo is pressed.
 */
export async function restoreVenue(
  queryClient: QueryClient,
  venue: VenueInput,
) {
  await sendJson<{ id: string }>("POST", "/api/venues", venue);
  await refresh(queryClient);
}

export function useCreateVenue() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (venue: VenueInput) =>
      sendJson<{ id: string }>("POST", "/api/venues", venue),
    onSuccess: refresh,
  });
}

export function useUpdateVenue(id: string) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (venue: VenueInput) =>
      sendJson<void>("PATCH", `/api/venues/${id}`, venue),
    onSuccess: refresh,
  });
}

export function useDeleteVenue() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: string) => sendJson<void>("DELETE", `/api/venues/${id}`),
    onSuccess: refresh,
  });
}
