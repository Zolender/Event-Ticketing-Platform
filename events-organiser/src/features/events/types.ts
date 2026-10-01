// The shapes the browser receives: only what the screens show (the props and hydrated cache are
// readable in the page source, so nothing else goes in).

export type EventStatus = "draft" | "published";

export type EventSummary = {
  id: string;
  title: string;
  status: EventStatus;
  startsAt: string;
  /** Decided on the server at request time, so server and browser render the same. */
  past: boolean;
  currency: string;
  venue: { name: string; city: string; timezone: string };
  /** Lowest and highest tier price in minor units, or null without tiers. */
  prices: { min: number; max: number } | null;
};

export type TicketTier = {
  id: string;
  name: string;
  price: number;
  capacity: number;
};

export type EventDetail = Omit<EventSummary, "venue"> & {
  description: string | null;
  firstPublishedAt: string | null;
  /** The event's public page while it is published; null for drafts, whose public address is a 404. */
  publicUrl: string | null;
  venue: EventSummary["venue"] & {
    id: string;
    address: string;
    country: string;
  };
  tiers: TicketTier[];
};
