import { z } from "zod";
import { venueSchema } from "../venues/venue-schema";
import { zoneCity } from "../venues/zones";
import { isCurrency, parseCapacity, parsePrice } from "./money";
import { formatPlainDate, isRealDate, isTime, localToUtc } from "./time";

// What the event form sends, checked the same way in the browser (as the organiser types) and in
// the route handler (before anything is saved). Errors are keyed by path: "title", "venue.city",
// "tiers.0.price". The date's daylight saving and past checks need the venue's zone and the
// clock, so they live in `checkWhen` below.

export const MAX_TIERS = 20;
export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 5000;

const tierSchema = z.object({
  id: z.uuid().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Name the tier.")
    .max(100, "Keep it to 100 characters."),
  price: z.string(),
  capacity: z.string(),
});

export const eventInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Give the event a title.")
      .max(TITLE_MAX, "Keep it to 200 characters."),
    description: z
      .string()
      .trim()
      .max(DESCRIPTION_MAX, "Keep it to 5,000 characters."),
    venue: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("existing"), id: z.uuid("Choose a venue.") }),
      venueSchema.extend({ kind: z.literal("new") }),
    ]),
    date: z.string().refine(isRealDate, "Choose a date."),
    time: z.string().refine(isTime, "Choose a time."),
    currency: z.string().refine(isCurrency, "Choose a currency."),
    tiers: z.array(tierSchema).max(MAX_TIERS, "At most 20 tiers."),
  })
  .superRefine((event, context) => {
    const seen = new Map<string, number>();
    event.tiers.forEach((tier, index) => {
      const price = parsePrice(tier.price, event.currency);
      if (!price.ok)
        context.addIssue({
          code: "custom",
          path: ["tiers", index, "price"],
          message: price.error,
        });
      const capacity = parseCapacity(tier.capacity);
      if (!capacity.ok)
        context.addIssue({
          code: "custom",
          path: ["tiers", index, "capacity"],
          message: capacity.error,
        });
      // Two tiers with the same name would leave buyers guessing which is which.
      const name = tier.name.trim().toLowerCase();
      if (name && seen.has(name))
        context.addIssue({
          code: "custom",
          path: ["tiers", index, "name"],
          message: "Another tier has this name.",
        });
      seen.set(name, index);
    });
  });

export type EventInput = z.input<typeof eventInputSchema>;
export type ParsedEvent = z.output<typeof eventInputSchema>;
export type FieldErrors = Record<string, string>;

/** The first message for each field, keyed by its path. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    errors[key] ??= issue.message;
  }
  return errors;
}

export function validateEvent(input: EventInput) {
  const result = eventInputSchema.safeParse(input);
  return result.success
    ? { ok: true as const, event: result.data }
    : { ok: false as const, errors: fieldErrors(result.error) };
}

/** The form works to the minute; a stored instant may carry seconds (seed data, older saves). */
export function sameMinute(a: string, b: string) {
  return (
    Math.floor(Date.parse(a) / 60_000) === Math.floor(Date.parse(b) / 60_000)
  );
}

export type WhenCheck =
  | { ok: true; iso: string; warning?: string }
  | { ok: false; field: "date" | "time"; error: string; suggestion?: string };

/**
 * The typed date and time at the venue, as an instant. A time inside a daylight saving gap is
 * refused with the time after the jump suggested. A passed date only warns on a draft (it may be
 * a record being corrected) and blocks on a published event, as the database does: only when the
 * date moves, so an event that has ended can still have its other details corrected.
 */
export function checkWhen(
  date: string,
  time: string,
  zone: string,
  now: number,
  published: boolean,
  storedIso?: string,
): WhenCheck {
  const result = localToUtc(date, time, zone);
  if (!result.ok) {
    return {
      ok: false,
      field: "time",
      error: `${time} doesn't exist on ${formatPlainDate(date)} in ${zoneCity(zone)}: the clocks go forward. Try ${result.suggestion}.`,
      suggestion: result.suggestion,
    };
  }
  if (Date.parse(result.iso) <= now) {
    const moved = !storedIso || !sameMinute(storedIso, result.iso);
    if (published && moved)
      return {
        ok: false,
        field: "date",
        error: "A published event needs a date in the future.",
      };
    return { ok: true, iso: result.iso, warning: "This date has passed." };
  }
  return { ok: true, iso: result.iso };
}
