import { emptyVenue, type VenueDraft } from "../venues/components/venue-fields";
import type { Venue } from "../venues/types";
import type { EventInput } from "./event-schema";
import { priceInput, type Currency } from "./money";
import { utcToLocal } from "./time";
import type { EventDetail } from "./types";

// What the form holds while the organiser types: plain strings, exactly as typed. Each tier has
// a `key` that stays with it through reordering, so its messages and animations follow it.

export type TierDraft = {
  key: string;
  id?: string;
  name: string;
  price: string;
  capacity: string;
};

export type EventDraft = {
  title: string;
  description: string;
  venueId: string;
  /** True while the "New venue" card is open: the event is saved with a new venue. */
  creatingVenue: boolean;
  newVenue: VenueDraft;
  date: string;
  time: string;
  currency: Currency;
  tiers: TierDraft[];
};

let keys = 0;
export const newTierKey = () => `tier-${++keys}`;

export function emptyDraft(venues: Venue[]): EventDraft {
  return {
    title: "",
    description: "",
    venueId: venues[0]?.id ?? "",
    creatingVenue: venues.length === 0,
    newVenue: emptyVenue,
    date: "",
    time: "",
    currency: "RWF",
    tiers: [],
  };
}

/** A saved event back in the form: its time on the venue's wall clock, prices in major units. */
export function draftFromEvent(event: EventDetail): EventDraft {
  const { date, time } = utcToLocal(event.startsAt, event.venue.timezone);
  return {
    title: event.title,
    description: event.description ?? "",
    venueId: event.venue.id,
    creatingVenue: false,
    newVenue: emptyVenue,
    date,
    time,
    currency: event.currency as Currency,
    tiers: event.tiers.map((tier) => ({
      key: newTierKey(),
      id: tier.id,
      name: tier.name,
      price: priceInput(tier.price, event.currency),
      capacity: String(tier.capacity),
    })),
  };
}

/** What is sent: the venue as chosen or as created, tiers in their order, nothing client-only. */
export function inputFromDraft(draft: EventDraft): EventInput {
  const { name, address, city, country, timezone } = draft.newVenue;
  return {
    title: draft.title,
    description: draft.description,
    venue: draft.creatingVenue
      ? { kind: "new", name, address, city, country, timezone }
      : { kind: "existing", id: draft.venueId },
    date: draft.date,
    time: draft.time,
    currency: draft.currency,
    tiers: draft.tiers.map(({ id, name, price, capacity }) =>
      id ? { id, name, price, capacity } : { name, price, capacity },
    ),
  };
}
