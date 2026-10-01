import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { VenuesView } from "@/features/venues/components/venues-view";
import { myVenuesQuery } from "@/features/venues/queries";
import { listMyVenues } from "@/features/venues/server/venues";
import { makeQueryClient } from "@/lib/query-client";
import { requireOrganiser } from "@/server/auth";

export const metadata: Metadata = { title: "Venues" };

export default async function VenuesPage() {
  const organiser = await requireOrganiser();
  // Prefetched through the data access layer, as for events; the browser's refetches go through
  // GET /api/venues, which calls the same function.
  const queryClient = makeQueryClient();
  await queryClient.prefetchQuery({
    ...myVenuesQuery(),
    queryFn: () => listMyVenues(organiser),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VenuesView />
    </HydrationBoundary>
  );
}
