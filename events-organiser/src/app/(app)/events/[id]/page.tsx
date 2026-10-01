import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetailView } from "@/features/events/components/event-detail-view";
import { myEventQuery } from "@/features/events/queries";
import { getMyEvent } from "@/features/events/server/events";
import { makeQueryClient } from "@/lib/query-client";
import { requireOrganiser } from "@/server/auth";

export async function generateMetadata({
  params,
}: PageProps<"/events/[id]">): Promise<Metadata> {
  const organiser = await requireOrganiser();
  const event = await getMyEvent(organiser, (await params).id);
  return { title: event?.title ?? "Event not found" };
}

export default async function EventPage({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;
  const organiser = await requireOrganiser();
  const event = await getMyEvent(organiser, id);
  // Missing and someone else's both end here, the same 404.
  if (!event) notFound();

  const queryClient = makeQueryClient();
  queryClient.setQueryData(myEventQuery(id).queryKey, event);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EventDetailView id={id} />
    </HydrationBoundary>
  );
}
