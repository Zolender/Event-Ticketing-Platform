import Link from "next/link";
import { formatEventDate, formatPriceRange } from "../format";
import type { EventSummary } from "../types";
import { StatusChip } from "./status-chip";

export function EventRow({ event }: { event: EventSummary }) {
  return (
    <li>
      <Link
        href={`/events/${event.id}`}
        className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-0.5 rounded-md bg-surface-container-low px-4 py-3 hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="text-title-md text-on-surface">{event.title}</span>
        <span className="row-span-2">
          <StatusChip status={event.status} past={event.past} />
        </span>
        <span className="text-body-md text-on-surface-variant">
          {formatEventDate(event.startsAt, event.venue.timezone)},{" "}
          {event.venue.name}, {event.venue.city}
          <span className="hidden sm:inline">
            . {formatPriceRange(event.prices, event.currency)}
          </span>
        </span>
      </Link>
    </li>
  );
}
