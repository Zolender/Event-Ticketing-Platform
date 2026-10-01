import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { EventForm } from "@/features/events/components/event-form";
import { myVenuesQuery } from "@/features/venues/queries";
import { listMyVenues } from "@/features/venues/server/venues";
import { makeQueryClient } from "@/lib/query-client";
import { requireOrganiser } from "@/server/auth";

export const metadata: Metadata = { title: "New event" };

export default async function NewEventPage() {
  const organiser = await requireOrganiser();
  const queryClient = makeQueryClient();
  await queryClient.prefetchQuery({
    ...myVenuesQuery(),
    queryFn: () => listMyVenues(organiser),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EventForm />
    </HydrationBoundary>
  );
}
