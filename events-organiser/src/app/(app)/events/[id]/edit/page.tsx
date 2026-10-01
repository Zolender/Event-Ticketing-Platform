import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventForm } from "@/features/events/components/event-form";
import { myEventQuery } from "@/features/events/queries";
import { getMyEvent } from "@/features/events/server/events";
import { myVenuesQuery } from "@/features/venues/queries";
import { listMyVenues } from "@/features/venues/server/venues";
import { makeQueryClient } from "@/lib/query-client";
import { requireOrganiser } from "@/server/auth";

export async function generateMetadata({
  params,
}: PageProps<"/events/[id]/edit">): Promise<Metadata> {
  const organiser = await requireOrganiser();
  const event = await getMyEvent(organiser, (await params).id);
  return { title: event ? `Edit ${event.title}` : "Event not found" };
}

export default async function EditEventPage({
  params,
}: PageProps<"/events/[id]/edit">) {
  const { id } = await params;
  const organiser = await requireOrganiser();
  const [event, venues] = await Promise.all([
    getMyEvent(organiser, id),
    listMyVenues(organiser),
  ]);
  // Missing and someone else's both end here, the same 404.
  if (!event) notFound();

  const queryClient = makeQueryClient();
  queryClient.setQueryData(myEventQuery(id).queryKey, event);
  queryClient.setQueryData(myVenuesQuery().queryKey, venues);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EventForm id={id} />
    </HydrationBoundary>
  );
}
