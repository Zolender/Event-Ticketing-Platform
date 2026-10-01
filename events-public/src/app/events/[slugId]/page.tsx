import type { Metadata } from "next";
import { EventView } from "@/features/events/components/event-view";
import {
  eventDescription,
  eventStructuredData,
  eventTitle,
  scriptJson,
} from "@/features/events/seo";
import { moreEvents } from "@/features/events/server/events";
import { findEvent } from "@/features/events/server/find-event";
import { siteUrl } from "@/server/env";

// Static regeneration: each event page is made on its first visit and then served from the
// cache. Edits, publishing and unpublishing will expire it at once through the database webhook;
// this limit also catches what no edit announces, an event passing its start time.
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps<"/events/[slugId]">): Promise<Metadata> {
  const event = await findEvent((await params).slugId);
  const title = eventTitle(event);
  const description = eventDescription(event);
  return {
    title,
    description,
    alternates: { canonical: event.path },
    openGraph: { title, description, url: event.path, type: "website" },
    twitter: { card: "summary_large_image", title, description },
    // An ended event's page stays for links already shared, out of search results.
    robots: event.past ? { index: false, follow: true } : undefined,
  };
}

export default async function EventPage({
  params,
}: PageProps<"/events/[slugId]">) {
  const event = await findEvent((await params).slugId);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: scriptJson(eventStructuredData(event, siteUrl())),
        }}
      />
      <EventView event={event} more={await moreEvents(event.publicId)} />
    </>
  );
}
