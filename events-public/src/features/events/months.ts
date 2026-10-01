import { monthLabel } from "./format";
import type { EventCard } from "./types";

/**
 * Events under month headings, a heading wherever the month changes. Built from everything loaded
 * so far, so a month that continues into the next "Load more" keeps one heading. Months are each
 * venue's own, like every date on the site.
 */
export function groupByMonth(events: EventCard[]) {
  const groups: { label: string; events: EventCard[] }[] = [];
  for (const event of events) {
    const label = monthLabel(event.startsAt, event.timeZone);
    const last = groups.at(-1);
    if (last?.label === label) last.events.push(event);
    else groups.push({ label, events: [event] });
  }
  return groups;
}
