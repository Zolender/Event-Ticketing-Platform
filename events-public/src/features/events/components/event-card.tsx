import Link from "next/link";
import { formatPriceRange, formatTime, stubDate, zoneCity } from "../format";
import type { EventCard as Card } from "../types";

/**
 * One event as a small ticket: details on the left, the date on a navy stub behind a notched
 * perforation. Used by "More events", the list and the home page. The mask that cuts the notches
 * sits on an inner element, so the link's focus ring is not cut too.
 */
export function EventCard({
  event,
  index = 0,
}: {
  event: Card;
  index?: number;
}) {
  const date = stubDate(event.startsAt, event.timeZone);
  return (
    <Link
      href={event.path}
      style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
      className="group block h-full animate-rise rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:animate-fade"
    >
      <span className="grid h-full grid-cols-[minmax(0,1fr)_5.75rem] rounded-lg ticket-notches [--cut:calc(100%-5.75rem)] [--notch:8px]">
        <span className="flex flex-col gap-0.5 bg-surface-container-low px-4 py-3.5 transition-colors group-hover:bg-surface-container-high">
          <span className="text-title-md text-on-surface">{event.title}</span>
          <span className="text-body-md text-on-surface-variant">
            {event.venueName}, {event.city}
          </span>
          <span className="text-body-md text-on-surface-variant">
            {formatTime(event.startsAt, event.timeZone)}{" "}
            {zoneCity(event.timeZone)} time
          </span>
          {event.prices && (
            <span className="mt-1.5 text-label-lg text-primary">
              {formatPriceRange(event.prices, event.currency)}
            </span>
          )}
        </span>
        <span className="flex flex-col items-center justify-center gap-1 border-l-2 border-dashed border-on-primary-container/45 bg-primary-container px-1 py-2 text-center text-on-primary-container">
          <span className="text-label-sm tracking-wider uppercase">
            {date.weekday}
          </span>
          <span className="text-[32px] leading-none">{date.day}</span>
          <span className="text-label-sm tracking-wider uppercase">
            {date.monthYear}
          </span>
        </span>
      </span>
    </Link>
  );
}
