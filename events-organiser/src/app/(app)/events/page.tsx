import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { EventsView } from "@/features/events/components/events-view";
import { myEventsQuery } from "@/features/events/queries";
import { listMyEvents } from "@/features/events/server/events";
import { makeQueryClient } from "@/lib/query-client";
import { requireOrganiser } from "@/server/auth";

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage() {
  const organiser = await requireOrganiser();

  // Prefetched by calling the data access layer directly (no HTTP round trip to our own API);
  // the browser's later refetches go through GET /api/events, which calls the same function.
  const queryClient = makeQueryClient();
  await queryClient.prefetchQuery({
    ...myEventsQuery(),
    queryFn: () => listMyEvents(organiser),
  });

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-headline-md">Your events</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <EventsView />
      </HydrationBoundary>
    </div>
  );
}
