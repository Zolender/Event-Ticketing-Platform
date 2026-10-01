import type { EventStatus } from "../events/types";

// The shapes the browser receives for venues.

export type Venue = {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
};

/** A venue with the events that use it, soonest first, for the venues page. */
export type VenueWithEvents = Venue & {
  events: {
    id: string;
    title: string;
    status: EventStatus;
    startsAt: string;
    /** Decided on the server at request time, so server and browser render the same. */
    past: boolean;
  }[];
};
