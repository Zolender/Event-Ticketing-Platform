import { EventView } from "@/features/events/components/event-view";
import { moreEvents } from "@/features/events/server/events";
import { findEvent } from "@/features/events/server/find-event";

// Static regeneration: each event page is made on its first visit and then served from the
// cache. Edits, publishing and unpublishing will expire it at once through the database webhook;
// this limit also catches what no edit announces, an event passing its start time.
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

export default async function EventPage({
  params,
}: PageProps<"/events/[slugId]">) {
  const event = await findEvent((await params).slugId);
  return <EventView event={event} more={await moreEvents(event.publicId)} />;
}
