import { queryOptions } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch-json";
import type { VenueWithEvents } from "./types";

export const venueKeys = {
  all: ["venues"] as const,
  lists: () => [...venueKeys.all, "list"] as const,
};

export const myVenuesQuery = () =>
  queryOptions({
    queryKey: venueKeys.lists(),
    queryFn: () => fetchJson<VenueWithEvents[]>("/api/venues"),
  });
