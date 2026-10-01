import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";
import { z } from "zod";
import type { Organiser } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase";
import { fieldErrors, type FieldErrors } from "../../events/event-schema";
import { venueSchema } from "../venue-schema";

// The venue writes. As with events: the verified organiser first, our own checks, and the
// database's refusals turned into codes the page words itself.

export type Refusal = {
  ok: false;
  status: number;
  code: string;
  message: string;
  fields?: FieldErrors;
};

const notFound: Refusal = {
  ok: false,
  status: 404,
  code: "not_found",
  message: "This venue does not exist.",
};

function parse(body: unknown) {
  const result = venueSchema.safeParse(body);
  if (result.success) return { ok: true as const, venue: result.data };
  return {
    ok: false as const,
    refusal: {
      ok: false,
      status: 400,
      code: "invalid_input",
      message: "Some fields need fixing.",
      fields: fieldErrors(result.error),
    } satisfies Refusal,
  };
}

function fromDatabase(error: PostgrestError): Refusal | null {
  if (error.code === "P0002") return notFound;
  if (error.code === "23503")
    return {
      ok: false,
      status: 409,
      code: "venue_in_use",
      message: "Events use this venue, so it cannot be deleted.",
    };
  if (error.code !== "23514") return null;
  if (error.message.includes("does not exist in the new timezone"))
    return {
      ok: false,
      status: 409,
      code: "time_gap",
      message:
        "An event here would fall in a clock change in that timezone. Move it first.",
    };
  if (error.message.includes("future date"))
    return {
      ok: false,
      status: 409,
      code: "event_would_pass",
      message:
        "A published event here would move into the past in that timezone.",
    };
  return null;
}

export async function createVenue(
  organiser: Organiser,
  body: unknown,
): Promise<{ ok: true; id: string } | Refusal> {
  const parsed = parse(body);
  if (!parsed.ok) return parsed.refusal;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("venues")
    .insert({ ...parsed.venue, organiser_id: organiser.id })
    .select("id")
    .single();
  if (error) {
    const refusal = fromDatabase(error);
    if (refusal) return refusal;
    throw error;
  }
  return { ok: true, id: data.id };
}

/**
 * Saves the venue; when its timezone changes, the database moves its events that have not started
 * so their wall-clock times stay as typed, in the same transaction.
 */
export async function updateVenue(
  organiser: Organiser,
  id: string,
  body: unknown,
): Promise<{ ok: true } | Refusal> {
  if (!z.uuid().safeParse(id).success) return notFound;
  const parsed = parse(body);
  if (!parsed.ok) return parsed.refusal;
  const { name, address, city, country, timezone } = parsed.venue;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_venue", {
    p_venue_id: id,
    p_name: name,
    p_address: address,
    p_city: city,
    p_country: country,
    p_timezone: timezone,
  });
  if (error) {
    const refusal = fromDatabase(error);
    if (refusal) return refusal;
    throw error;
  }
  return { ok: true };
}

/** Only a venue no event points to, past events included: the database refuses otherwise. */
export async function deleteVenue(
  organiser: Organiser,
  id: string,
): Promise<{ ok: true } | Refusal> {
  if (!z.uuid().safeParse(id).success) return notFound;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("venues")
    .delete()
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
