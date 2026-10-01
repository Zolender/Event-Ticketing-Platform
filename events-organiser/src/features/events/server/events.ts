import "server-only";
import { z } from "zod";
import type { Organiser } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase";
import type { EventDetail, EventSummary } from "../types";

// Every function takes the verified organiser, so a caller cannot reach events without one.
// Supabase runs as that organiser (row-level security); the explicit organiser filter is the
// second layer.

export async function listMyEvents(
  organiser: Organiser,
): Promise<EventSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, status, starts_at, currency, venues(name, city, timezone), ticket_tiers(price)",
    )
    .eq("organiser_id", organiser.id)
    .order("starts_at", { ascending: true });
  if (error) throw error;

  return data.map((event) => {
    const prices = event.ticket_tiers.map((tier) => tier.price);
    return {
      id: event.id,
      title: event.title,
      status: event.status,
      startsAt: event.starts_at,
      past: Date.parse(event.starts_at) <= Date.now(),
      currency: event.currency,
      venue: event.venues,
      prices: prices.length
        ? { min: Math.min(...prices), max: Math.max(...prices) }
        : null,
    };
  });
}

/** The event, or null when it does not exist or belongs to someone else (both answer 404). */
export async function getMyEvent(
  organiser: Organiser,
  id: string,
): Promise<EventDetail | null> {
  if (!z.uuid().safeParse(id).success) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, status, starts_at, currency, description, first_published_at, venues(id, name, address, city, country, timezone), ticket_tiers(id, name, price, capacity, position)",
    )
    .eq("id", id)
    .eq("organiser_id", organiser.id)
    .order("position", { referencedTable: "ticket_tiers", ascending: true })
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const prices = data.ticket_tiers.map((tier) => tier.price);
  return {
    id: data.id,
    title: data.title,
    status: data.status,
    startsAt: data.starts_at,
    past: Date.parse(data.starts_at) <= Date.now(),
    currency: data.currency,
    description: data.description,
    firstPublishedAt: data.first_published_at,
    venue: data.venues,
    prices: prices.length
      ? { min: Math.min(...prices), max: Math.max(...prices) }
      : null,
    tiers: data.ticket_tiers.map(({ id, name, price, capacity }) => ({
      id,
      name,
      price,
      capacity,
    })),
  };
}
