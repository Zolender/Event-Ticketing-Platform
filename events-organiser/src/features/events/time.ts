import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// An event's time is what the organiser typed, on the venue's wall clock, in the venue's zone.
// Dates and times travel as plain strings ("2026-11-10", "19:30") until the server turns them
// into an instant; a bare date is never handed to `new Date`, which would read it as UTC midnight.

export type PlainDate = string;
export type PlainTime = string;

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

const pad = (value: number) => String(value).padStart(2, "0");

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** "2026-02-30" has the right shape but is not a day. */
export function isRealDate(date: string) {
  if (!DATE_PATTERN.test(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  return (
    month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month)
  );
}

export function isTime(time: string) {
  return TIME_PATTERN.test(time);
}

/** The instant shown on the zone's wall clock, as "YYYY-MM-DD HH:mm". */
function wallClock(instant: number, zone: string) {
  return dayjs(instant).tz(zone).format("YYYY-MM-DD HH:mm");
}

function offsetMinutes(instant: number, zone: string) {
  return dayjs(instant).tz(zone).utcOffset();
}

export type LocalToUtc =
  | { ok: true; iso: string }
  /** The time does not exist that day (clocks jump forward); `suggestion` is the time after it. */
  | { ok: false; reason: "gap"; suggestion: PlainTime };

/**
 * A wall-clock date and time in a zone, as a UTC instant. The two offsets around the time (a day
 * before and after) give at most two candidates; the ones that read back as the same wall clock
 * are real. None: the time falls in a daylight saving gap. Two: it happens twice (clocks going
 * back) and the first occurrence wins.
 */
export function localToUtc(
  date: PlainDate,
  time: PlainTime,
  zone: string,
): LocalToUtc {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const asIfUtc = Date.UTC(year, month - 1, day, hour, minute);
  const before = offsetMinutes(asIfUtc - DAY, zone);
  const after = offsetMinutes(asIfUtc + DAY, zone);
  const real = [...new Set([before, after])]
    .map((offset) => asIfUtc - offset * MINUTE)
    .filter((instant) => wallClock(instant, zone) === `${date} ${time}`);

  if (real.length)
    return { ok: true, iso: new Date(Math.min(...real)).toISOString() };
  return {
    ok: false,
    reason: "gap",
    suggestion: wallClock(asIfUtc - before * MINUTE, zone).slice(11),
  };
}

/** A stored instant back on the venue's wall clock, to fill the form. */
export function utcToLocal(iso: string, zone: string) {
  const local = dayjs(iso).tz(zone);
  return { date: local.format("YYYY-MM-DD"), time: local.format("HH:mm") };
}

/** Today's date at the venue, which may differ from the organiser's own date. */
export function todayIn(zone: string, now: number): PlainDate {
  return dayjs(now).tz(zone).format("YYYY-MM-DD");
}

/** Every quarter hour of a day, the time menu's grid. */
export const quarterHours: PlainTime[] = Array.from(
  { length: 96 },
  (_, index) => `${pad(Math.floor(index / 4))}:${pad((index % 4) * 15)}`,
);

/** The menu's times, with an off-grid current value (13:37) kept in its place, never snapped. */
export function timeOptions(current: PlainTime | null): PlainTime[] {
  if (!current || quarterHours.includes(current)) return quarterHours;
  return [...quarterHours, current].sort();
}

/** One month for the date picker: blanks first so weeks start on Monday, then each day. */
export function monthGrid(year: number, month: number): (PlainDate | null)[] {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const blanks = (firstWeekday + 6) % 7;
  const days = Array.from(
    { length: daysInMonth(year, month) },
    (_, index) => `${year}-${pad(month)}-${pad(index + 1)}`,
  );
  return [...Array<null>(blanks).fill(null), ...days];
}

export function addMonths(year: number, month: number, delta: number) {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

const splitDate = (date: PlainDate) =>
  date.split("-").map(Number) as [number, number, number];
const joinDate = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}`;

/** A plain date moved by days, worked out in UTC so no zone or daylight saving is involved. */
export function shiftDays(date: PlainDate, days: number) {
  const [year, month, day] = splitDate(date);
  const moved = new Date(Date.UTC(year, month - 1, day + days));
  return joinDate(
    moved.getUTCFullYear(),
    moved.getUTCMonth() + 1,
    moved.getUTCDate(),
  );
}

/** Moved by months, keeping the day where it exists: 31 January plus a month is 28 February. */
export function shiftMonths(date: PlainDate, months: number) {
  const [year, month, day] = splitDate(date);
  const next = addMonths(year, month, months);
  return joinDate(
    next.year,
    next.month,
    Math.min(day, daysInMonth(next.year, next.month)),
  );
}

/** 0 for Monday to 6 for Sunday. */
export function weekdayOf(date: PlainDate) {
  const [year, month, day] = splitDate(date);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

/** "Tue 10 Nov 2026". Read at noon UTC, so the day is the same whatever the device's zone. */
export function formatPlainDate(date: PlainDate) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).formatToParts(new Date(`${date}T12:00:00Z`));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value;
  return `${part("weekday")} ${part("day")} ${part("month")} ${part("year")}`;
}

/** "November 2026", the date picker's heading. */
export function formatMonth(year: number, month: number) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 15)));
}

/** "UTC+2", "UTC+5:30", "UTC" for a zone at a given moment (offsets change with the seasons). */
export function utcOffsetLabel(zone: string, at: number) {
  const offset = offsetMinutes(at, zone);
  if (offset === 0) return "UTC";
  const sign = offset > 0 ? "+" : "-";
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  return `UTC${sign}${hours}${minutes ? `:${pad(minutes)}` : ""}`;
}
