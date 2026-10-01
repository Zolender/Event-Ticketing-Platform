import { formatDateTime, isoWithOffset, majorUnits } from "./format";
import type { EventDetail } from "./types";

// What search engines and link previews read about an event.

const DESCRIPTION_LENGTH = 155;

/** Cut at a word so it ends near `length` characters, with an ellipsis when something was cut. */
export function cutAtWord(text: string, length: number) {
  if (text.length <= length) return text;
  const cut = text.slice(0, length - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > length / 2 ? cut.slice(0, space) : cut).replace(/[\s,.;:!?-]+$/, "")}…`;
}

/**
 * When and where first, so a preview is useful even without the image, then the organiser's own
 * words, on one line. Ended events say so first: their pages stay for links already shared.
 */
export function eventDescription(event: EventDetail) {
  const when = `${formatDateTime(event.startsAt, event.timeZone)} at ${event.venueName}, ${event.city}.`;
  const lead = event.past ? `This event has ended. ${when}` : when;
  const words = event.description.replace(/\s+/g, " ").trim();
  return cutAtWord(words ? `${lead} ${words}` : lead, DESCRIPTION_LENGTH);
}

/** The page title before the site's " | Tiketi": the city is what people search with. */
export function eventTitle(event: EventDetail) {
  return `${event.title}, ${event.city}`;
}

/**
 * schema.org Event and BreadcrumbList. One offer per tier, with no availability: nothing is sold
 * here and no sales are tracked, so claiming stock would be untrue.
 */
export function eventStructuredData(event: EventDetail, site: URL) {
  const url = new URL(event.path, site).href;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.title,
      description: event.description,
      startDate: isoWithOffset(event.startsAt, event.timeZone),
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      url,
      image: [`${url}/opengraph-image`],
      location: {
        "@type": "Place",
        name: event.venueName,
        address: {
          "@type": "PostalAddress",
          streetAddress: event.venueAddress,
          addressLocality: event.city,
          addressCountry: event.country,
        },
      },
      organizer: { "@type": "Organization", name: event.organiserName },
      offers: event.tiers.map((tier) => ({
        "@type": "Offer",
        name: tier.name,
        price: majorUnits(tier.price, event.currency),
        priceCurrency: event.currency,
        url,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Events",
          item: new URL("/events", site).href,
        },
        { "@type": "ListItem", position: 2, name: event.title, item: url },
      ],
    },
  ];
}

/**
 * JSON for a <script> tag. Organiser text is inside, so "<" (and the line separators JavaScript
 * once refused) are written as escapes: "</script>" in a description cannot end the tag.
 */
export function scriptJson(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
