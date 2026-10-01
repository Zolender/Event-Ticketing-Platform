import { utcToLocal } from "../events/time";
import type { VenueWithEvents } from "./types";
import { zoneCity } from "./zones";

type Fields = {
  name: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
};

/**
 * What saving a venue edit does to its events, said before the organiser saves. Upcoming events
 * keep their wall-clock time when the zone changes (the database moves their instants); ended
 * ones keep their recorded time; published ones show any change on the public site at once.
 */
export function venueChangeImpact(
  venue: VenueWithEvents,
  next: Fields,
): string[] {
  const lines: string[] = [];
  const upcoming = venue.events.filter((event) => !event.past);
  const ended = venue.events.length - upcoming.length;
  const published = venue.events.filter(
    (event) => event.status === "published",
  ).length;
  const zoneChanged = next.timezone !== venue.timezone;
  const detailsChanged = (["name", "address", "city", "country"] as const).some(
    (field) => next[field].trim() !== venue[field],
  );

  if (zoneChanged && upcoming.length) {
    const first = upcoming[0];
    const { time } = utcToLocal(first.startsAt, venue.timezone);
    const others = upcoming.length - 1;
    lines.push(
      `Times stay as typed: “${first.title}” stays at ${time}, now ${zoneCity(next.timezone)} time${
        others === 1
          ? ", and so does the other event to come"
          : others
            ? `, and so do the other ${others} events to come`
            : ""
      }.`,
    );
  }
  if (zoneChanged && ended)
    lines.push(
      ended === 1
        ? "The event that has ended keeps its recorded time."
        : `The ${ended} events that have ended keep their recorded time.`,
    );
  if ((zoneChanged || detailsChanged) && venue.events.length) {
    lines.push(
      published
        ? `${published === 1 ? "1 published event shows" : `${published} published events show`} the change on the public site at once.`
        : "Only drafts use this venue, so nothing public changes.",
    );
  }
  return lines;
}

/** Another of the organiser's venues with the same name in the same city, if any. */
export function duplicateOf<
  T extends { id: string; name: string; city: string },
>(venues: T[], draft: { name: string; city: string }, ownId?: string) {
  const same = (a: string, b: string) =>
    a.trim().toLowerCase() === b.trim().toLowerCase();
  if (!draft.name.trim() || !draft.city.trim()) return undefined;
  return venues.find(
    (venue) =>
      venue.id !== ownId &&
      same(venue.name, draft.name) &&
      same(venue.city, draft.city),
  );
}
