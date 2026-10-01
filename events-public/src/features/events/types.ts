// The shapes pages and the browser receive. Everything here is public by construction (it comes
// from the published_events view), and still only what the screens show.

import type { PriceRange } from "./format";

export type Tier = { name: string; price: number; capacity: number };

/** One event in a list: home, the events list, "More events". */
export type EventCard = {
  publicId: string;
  path: string;
  title: string;
  startsAt: string;
  timeZone: string;
  venueName: string;
  city: string;
  currency: string;
  /** Lowest and highest tier price in minor units; null without tiers. */
  prices: PriceRange | null;
};

export type EventDetail = EventCard & {
  slug: string;
  description: string;
  venueAddress: string;
  country: string;
  organiserName: string;
  tiers: Tier[];
  updatedAt: string;
};

export type EventPage = {
  events: EventCard[];
  /** Null on the last page. */
  nextCursor: string | null;
  /** How many events match, sent with the first page of a search only. */
  total?: number;
};
