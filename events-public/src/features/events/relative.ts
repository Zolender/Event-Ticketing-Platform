import { formatDate, formatTime, zoneCity } from "./format";

// Text that depends on the visitor's clock or zone. Computed only in the browser, after the page
// has loaded, so cached HTML never carries a stale countdown and server and browser agree.

function dayNumber(ms: number, timeZone: string) {
  const values = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(ms));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(values.find((p) => p.type === type)?.value);
  return Date.UTC(part("year"), part("month") - 1, part("day")) / 86_400_000;
}

/** "Tonight", "Today", "Tomorrow", "In 16 days", by the venue's calendar; null once started. */
export function countdownLabel(
  startsAt: string,
  timeZone: string,
  now: number,
) {
  const start = Date.parse(startsAt);
  if (start <= now) return null;
  const days = dayNumber(start, timeZone) - dayNumber(now, timeZone);
  if (days === 0) {
    const hour = Number(formatTime(startsAt, timeZone).slice(0, 2));
    return hour >= 17 ? "Tonight" : "Today";
  }
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

/**
 * The start in the visitor's own zone, "21:30 your time (London)", with the date when the day
 * differs. Null when it would read the same as the venue's time.
 */
export function visitorTime(
  startsAt: string,
  venueZone: string,
  visitorZone: string,
) {
  if (visitorZone === venueZone) return null;
  const date = formatDate(startsAt, visitorZone);
  const time = formatTime(startsAt, visitorZone);
  const venueDate = formatDate(startsAt, venueZone);
  if (date === venueDate && time === formatTime(startsAt, venueZone))
    return null;
  return `${date === venueDate ? "" : `${date}, `}${time} your time (${zoneCity(visitorZone)})`;
}
