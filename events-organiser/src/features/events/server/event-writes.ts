import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";
import { z } from "zod";
import type { Organiser } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase";
import {
  checkWhen,
  sameMinute,
  validateEvent,
  type FieldErrors,
} from "../event-schema";
import { parseCapacity, parsePrice } from "../money";
import { slugify } from "../slug";

// The event writes. Each takes the verified organiser, checks what it can itself (one home for
// the rules), and leaves the last word to the database: its policies and triggers refuse anything
// that slips past, and those refusals come back here as codes the pages word themselves.

export type Refusal = {
  ok: false;
  status: number;
  code: string;
  message: string;
  fields?: FieldErrors;
  suggestion?: string;
};
type Done<T> = { ok: true } & T;

const notFound: Refusal = {
  ok: false,
  status: 404,
  code: "not_found",
  message: "This event does not exist.",
};

/** The publishing rules, as the database words them, to codes. */
function fromDatabase(error: PostgrestError): Refusal | null {
  if (error.code === "P0002") return notFound;
  if (error.code === "23503")
    return {
      ok: false,
      status: 400,
      code: "invalid_input",
      message: "Choose one of your venues.",
      fields: { venue: "Choose a venue." },
    };
  if (error.code !== "23514") return null;
  const rules: [string, string, string][] = [
    [
      "description",
      "needs_description",
      "A published event needs a description.",
    ],
    [
      "future date",
      "needs_future_date",
      "A published event needs a date in the future.",
    ],
    [
      "ticket tier",
      "needs_tier",
      "A published event needs at least one ticket tier.",
    ],
  ];
  const rule = rules.find(([text]) => error.message.includes(text));
  return rule
    ? { ok: false, status: 409, code: rule[1], message: rule[2] }
    : null;
}

/** Creates the event (no id) or saves over it, tiers and an inline new venue included. */
export async function saveEvent(
  organiser: Organiser,
  body: unknown,
  id?: string,
): Promise<Done<{ id: string }> | Refusal> {
  if (id !== undefined && !z.uuid().safeParse(id).success) return notFound;

  const result = validateEvent(body as never);
  if (!result.ok)
    return {
      ok: false,
      status: 400,
      code: "invalid_input",
      message: "Some fields need fixing.",
      fields: result.errors,
    };
  const event = result.event;
  const supabase = await createSupabaseServerClient();

  let published = false;
  let storedIso: string | undefined;
  if (id) {
    const { data, error } = await supabase
      .from("events")
      .select("status, starts_at")
      .eq("id", id)
      .eq("organiser_id", organiser.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return notFound;
    published = data.status === "published";
    storedIso = data.starts_at;
  }

  let zone: string;
  if (event.venue.kind === "existing") {
    const { data, error } = await supabase
      .from("venues")
      .select("timezone")
      .eq("id", event.venue.id)
      .eq("organiser_id", organiser.id)
      .maybeSingle();
    if (error) throw error;
    if (!data)
      return {
        ok: false,
        status: 400,
        code: "invalid_input",
        message: "Choose one of your venues.",
        fields: { venue: "Choose a venue." },
      };
    zone = data.timezone;
  } else {
    zone = event.venue.timezone;
  }

  const when = checkWhen(
    event.date,
    event.time,
    zone,
    Date.now(),
    published,
    storedIso,
  );
  if (!when.ok)
    return {
      ok: false,
      status: 400,
      code: when.suggestion ? "time_gap" : "needs_future_date",
      message: when.error,
      fields: { [when.field]: when.error },
      suggestion: when.suggestion,
    };

  const { venue } = event;
  const { data, error } = await supabase.rpc("save_event", {
    p_event_id: id,
    p_venue_id: venue.kind === "existing" ? venue.id : undefined,
    p_new_venue:
      venue.kind === "new"
        ? {
            name: venue.name,
            address: venue.address,
            city: venue.city,
            country: venue.country,
            timezone: venue.timezone,
          }
        : undefined,
    p_title: event.title,
    p_slug: slugify(event.title),
    p_description: event.description || undefined,
    // An unchanged minute keeps the stored instant exactly, so the database sees no date move.
    p_starts_at:
      storedIso && sameMinute(storedIso, when.iso) ? storedIso : when.iso,
    p_currency: event.currency,
    // Already validated above, so these parse.
    p_tiers: event.tiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      price: (parsePrice(tier.price, event.currency) as { minor: number })
        .minor,
      capacity: (parseCapacity(tier.capacity) as { value: number }).value,
    })),
  });
  if (error) {
    const refusal = fromDatabase(error);
    if (refusal) return refusal;
    throw error;
  }
  return { ok: true, id: data };
}

/** Publish or unpublish. The database's trigger holds the publishing rules. */
export async function setPublished(
  organiser: Organiser,
  id: string,
  publish: boolean,
): Promise<Done<object> | Refusal> {
  if (!z.uuid().safeParse(id).success) return notFound;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .update({ status: publish ? "published" : "draft" })
    .eq("id", id)
    .eq("organiser_id", organiser.id)
    .select("id")
    .maybeSingle();
  if (error) {
    const refusal = fromDatabase(error);
    if (refusal) return refusal;
    throw error;
  }
  return data ? { ok: true } : notFound;
}

/** Only an event that was never published: once public, it may have been shared or indexed. */
export async function deleteEvent(
  organiser: Organiser,
  id: string,
): Promise<Done<object> | Refusal> {
  if (!z.uuid().safeParse(id).success) return notFound;
  const supabase = await createSupabaseServerClient();
  const { data: event, error: readError } = await supabase
    .from("events")
    .select("first_published_at")
    .eq("id", id)
    .eq("organiser_id", organiser.id)
    .maybeSingle();
  if (readError) throw readError;
  if (!event) return notFound;
  if (event.first_published_at)
    return {
      ok: false,
      status: 409,
      code: "published_before",
      message: "This event has been published, so it can only be unpublished.",
    };

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)
    .eq("organiser_id", organiser.id);
  if (error) throw error;
  return { ok: true };
}
