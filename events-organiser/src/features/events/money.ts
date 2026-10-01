// Prices are stored in the currency's minor units (pence, cents; RWF has none) and typed in its
// major units, the way people write them: "8000" francs, "12.50" pounds.

export const currencies = [
  "RWF",
  "KES",
  "UGX",
  "TZS",
  "BIF",
  "ETB",
  "NGN",
  "GHS",
  "ZAR",
  "USD",
  "EUR",
  "GBP",
] as const;
export type Currency = (typeof currencies)[number];

export function isCurrency(value: string): value is Currency {
  return (currencies as readonly string[]).includes(value);
}

/** "Rwandan Franc". */
export function currencyName(currency: string) {
  return (
    new Intl.DisplayNames(["en-GB"], { type: "currency" }).of(currency) ??
    currency
  );
}

/** How many decimals the currency uses: 0 for RWF and UGX, 2 for GBP. */
export function currencyDigits(currency: string) {
  return (
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  );
}

/** Well inside the database's integer column, and far above any real ticket. */
export const MAX_PRICE_MINOR = 1_000_000_000;

export type ParsedPrice =
  { ok: true; minor: number } | { ok: false; error: string };

/** "8,000" or "8000" or "12.50" in major units, to minor units. Worked on the digits, not floats. */
export function parsePrice(input: string, currency: string): ParsedPrice {
  const digits = currencyDigits(currency);
  const text = input.trim().replaceAll(",", "").replaceAll(" ", "");
  const example = digits ? "12.50" : "8000";
  if (!text)
    return { ok: false, error: "Enter a price. Use 0 for free tickets." };
  const match = /^(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) return { ok: false, error: `Enter a price, like ${example}.` };
  const [, whole, fraction = ""] = match;
  if (fraction.length > digits) {
    return {
      ok: false,
      error: digits
        ? `Use at most ${digits} decimals.`
        : `${currency} has no smaller unit. Enter a whole amount.`,
    };
  }
  const minor =
    Number(whole) * 10 ** digits + Number(fraction.padEnd(digits, "0") || "0");
  if (minor > MAX_PRICE_MINOR)
    return { ok: false, error: "That price is too high." };
  return { ok: true, minor };
}

/** Minor units back to what goes in the field: 1250 GBP is "12.50", 8000 RWF is "8000". */
export function priceInput(minor: number, currency: string) {
  const digits = currencyDigits(currency);
  if (!digits) return String(minor);
  const unit = 10 ** digits;
  return `${Math.floor(minor / unit)}.${String(minor % unit).padStart(digits, "0")}`;
}

export const MAX_CAPACITY = 1_000_000;

export type ParsedCapacity =
  { ok: true; value: number } | { ok: false; error: string };

export function parseCapacity(input: string): ParsedCapacity {
  const text = input.trim().replaceAll(",", "").replaceAll(" ", "");
  if (!text) return { ok: false, error: "Enter how many tickets." };
  if (!/^\d+$/.test(text))
    return { ok: false, error: "Enter a whole number, like 200." };
  const value = Number(text);
  if (value < 1) return { ok: false, error: "At least 1 ticket." };
  if (value > MAX_CAPACITY)
    return { ok: false, error: "At most 1,000,000 tickets." };
  return { ok: true, value };
}
