// Always formatted with the venue's zone and one locale, so the server (UTC on Vercel) and the
// browser (the visitor's zone) produce the same text.
const LOCALE = "en-GB";

/** "Tue 13 Oct, 19:30", with the year added when it is not the current one: "Sun 28 Mar 2027, 19:30". */
export function formatEventDate(iso: string, timeZone: string) {
  const date = new Date(iso);
  const year = (d: Date) =>
    new Intl.DateTimeFormat(LOCALE, { timeZone, year: "numeric" }).format(d);
  const parts = new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const shownYear = year(date) === year(new Date()) ? "" : ` ${part("year")}`;
  return `${part("weekday")} ${part("day")} ${part("month")}${shownYear}, ${part("hour")}:${part("minute")}`;
}

/** "Africa/Kigali" becomes "Kigali time". */
export function zoneLabel(timeZone: string) {
  return `${timeZone.split("/").pop()?.replaceAll("_", " ")} time`;
}

/** Minor units in the currency's own precision: RWF has none, GBP has pence. 0 reads "Free". */
export function formatPrice(minor: number, currency: string) {
  if (minor === 0) return "Free";
  const format = new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    trailingZeroDisplay: "stripIfInteger",
  });
  const digits = format.resolvedOptions().maximumFractionDigits ?? 2;
  return format.format(minor / 10 ** digits);
}

export function formatPriceRange(
  prices: { min: number; max: number } | null,
  currency: string,
) {
  if (!prices) return "No ticket tiers yet";
  if (prices.min === prices.max) return formatPrice(prices.min, currency);
  return `${formatPrice(prices.min, currency)} to ${formatPrice(prices.max, currency)}`;
}
