// Dates and prices, always in the venue's zone and one locale, so the server (UTC on Vercel) and
// the browser (the visitor's zone) write the same text. The year is always shown: a public page
// can stay cached for months, and ended pages for good.

const LOCALE = "en-GB";

function parts(iso: string, timeZone: string) {
  const values = new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    values.find((p) => p.type === type)?.value ?? "";
  return {
    weekday: part("weekday"),
    day: part("day"),
    month: part("month"),
    year: part("year"),
    time: `${part("hour")}:${part("minute")}`,
  };
}

/** "Sat 17 Oct 2026" */
export function formatDate(iso: string, timeZone: string) {
  const p = parts(iso, timeZone);
  return `${p.weekday} ${p.day} ${p.month} ${p.year}`;
}

/** "19:30" */
export function formatTime(iso: string, timeZone: string) {
  return parts(iso, timeZone).time;
}

/** "Sat 17 Oct 2026, 19:30" */
export function formatDateTime(iso: string, timeZone: string) {
  return `${formatDate(iso, timeZone)}, ${formatTime(iso, timeZone)}`;
}

/** The pieces of the date on a ticket stub: "Sat", "17", "Oct 2026". */
export function stubDate(iso: string, timeZone: string) {
  const p = parts(iso, timeZone);
  return { weekday: p.weekday, day: p.day, monthYear: `${p.month} ${p.year}` };
}

/** "October 2026", the heading the list groups events under. */
export function monthLabel(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

/** "Africa/Kigali" becomes "Kigali", "America/New_York" becomes "New York". */
export function zoneCity(timeZone: string) {
  return (timeZone.split("/").pop() ?? timeZone).replaceAll("_", " ");
}

/** The zone's offset at that instant: "+02:00", "-04:00", "+05:30", "+00:00". */
export function zoneOffset(iso: string, timeZone: string) {
  const name =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(new Date(iso))
      .find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  // Intl writes a zero offset as plain "GMT".
  return name === "GMT" ? "+00:00" : name.replace("GMT", "");
}

/** The venue's wall clock with its offset, for structured data: "2026-10-17T19:30:00+02:00". */
export function isoWithOffset(iso: string, timeZone: string) {
  const values = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    values.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}${zoneOffset(iso, timeZone)}`;
}

function currencyDigits(currency: string) {
  return (
    new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  );
}

/** Minor units as a plain decimal in the currency's own precision: 8000 RWF "8000", 1250 GBP "12.50". */
export function majorUnits(minor: number, currency: string) {
  const digits = currencyDigits(currency);
  if (digits === 0) return String(minor);
  const text = String(minor).padStart(digits + 1, "0");
  return `${text.slice(0, -digits)}.${text.slice(-digits)}`;
}

/** "RWF 8,000", "£12.50", and "Free" for zero. */
export function formatPrice(minor: number, currency: string) {
  if (minor === 0) return "Free";
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    trailingZeroDisplay: "stripIfInteger",
  }).format(Number(majorUnits(minor, currency)));
}

export type PriceRange = { min: number; max: number };

/** "RWF 8,000", "Free to RWF 10,000", or "Free" when every tier is. */
export function formatPriceRange(range: PriceRange, currency: string) {
  if (range.min === range.max) return formatPrice(range.min, currency);
  return `${formatPrice(range.min, currency)} to ${formatPrice(range.max, currency)}`;
}

/** The hero's line: "From RWF 6,000"; one price alone; the full range when the cheapest is free. */
export function formatFromPrice(range: PriceRange, currency: string) {
  if (range.min === range.max || range.min === 0)
    return formatPriceRange(range, currency);
  return `From ${formatPrice(range.min, currency)}`;
}
