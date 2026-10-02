import "server-only";
import { cache } from "react";
import { createSupabaseClient } from "@/server/supabase";
import { encodeCursor, type Cursor } from "../cursor";
import { monthLabel } from "../format";
import { containsPattern } from "../search";
import type { EventCard, EventDetail, EventPage, Tier } from "../types";
import { eventPath } from "../url";

// The site's only way to the data. Everything comes from the published_events view, the one thing
// the publishable key may read, so a draft cannot come back from here whatever a caller asks.

export const PAGE_SIZE = 12;

const CARD_COLUMNS =
  "public_id, slug, title, starts_at, currency, venue_name, venue_city, venue_timezone, tiers";
const DETAIL_COLUMNS = `${CARD_COLUMNS}, description, venue_address, venue_country, organiser_name, updated_at`;

type Row = Record<string, unknown>;

// The view's columns all read as nullable in the generated types; the tables behind them are not.
function text(row: Row, column: string) {
  const value = row[column];
  if (typeof value !== "string")
    throw new Error(`published_events.${column} is missing.`);
  return value;
}

function tiersOf(row: Row): Tier[] {
  const tiers = row.tiers;
  return Array.isArray(tiers)
    ? tiers.map((tier) => ({
        name: String(tier.name),
        price: Number(tier.price),
        capacity: Number(tier.capacity),
      }))
    : [];
}

function toCard(row: Row): EventCard {
  const prices = tiersOf(row).map((tier) => tier.price);
  return {
    publicId: text(row, "public_id"),
    path: eventPath(text(row, "slug"), text(row, "public_id")),
    title: text(row, "title"),
    startsAt: text(row, "starts_at"),
    timeZone: text(row, "venue_timezone"),
    venueName: text(row, "venue_name"),
    city: text(row, "venue_city"),
    currency: text(row, "currency"),
    prices: prices.length
      ? { min: Math.min(...prices), max: Math.max(...prices) }
      : null,
  };
}

/** A published event by its public id, or null (unknown and draft alike). Once per request. */
export const getPublishedEvent = cache(
  async (publicId: string): Promise<EventDetail | null> => {
    const { data, error } = await createSupabaseClient()
      .from("published_events")
      .select(DETAIL_COLUMNS)
      .eq("public_id", publicId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as Row;
    return {
      ...toCard(row),
      slug: text(row, "slug"),
      description: text(row, "description"),
      venueAddress: text(row, "venue_address"),
      country: text(row, "venue_country"),
      organiserName: text(row, "organiser_name"),
      tiers: tiersOf(row),
      updatedAt: text(row, "updated_at"),
      past: Date.parse(text(row, "starts_at")) <= Date.now(),
    };
  },
);

/**
 * Upcoming events, soonest first, a page at a time. `search` must already be normalised. Asks for
 * one more than a page to know whether another page exists without an empty extra request.
 */
export async function listUpcoming({
  search,
  cursor,
  limit = PAGE_SIZE,
}: {
  search?: string | null;
  cursor?: Cursor | null;
  limit?: number;
}): Promise<EventPage> {
  const withTotal = Boolean(search) && !cursor;
  let query = createSupabaseClient()
    .from("published_events")
    .select(CARD_COLUMNS, withTotal ? { count: "exact" } : undefined)
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .order("public_id", { ascending: true })
    .limit(limit + 1);
  if (search) query = query.ilike("search_text", containsPattern(search));
  if (cursor) {
    // Both values were checked by decodeCursor, so they cannot change the filter's shape.
    query = query.or(
      `starts_at.gt."${cursor.startsAt}",and(starts_at.eq."${cursor.startsAt}",public_id.gt.${cursor.publicId})`,
    );
  }
  const { data, error, count } = await query;
  if (error) throw error;

  const rows = (data ?? []) as Row[];
  const events = rows.slice(0, limit).map(toCard);
  const last = events.at(-1);
  return {
    events,
    nextCursor:
      rows.length > limit && last
        ? encodeCursor({ startsAt: last.startsAt, publicId: last.publicId })
        : null,
    ...(withTotal ? { total: count ?? events.length } : {}),
  };
}

/** The next few upcoming events other than this one, for "More events". */
export async function moreEvents(exceptPublicId: string, limit = 3) {
  const { data, error } = await createSupabaseClient()
    .from("published_events")
    .select(CARD_COLUMNS)
    .gt("starts_at", new Date().toISOString())
    .neq("public_id", exceptPublicId)
    .order("starts_at", { ascending: true })
    .order("public_id", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as Row[]).map(toCard);
}

export type UpcomingSummary = {
  events: number;
  venues: number;
  /** Months in the order they come, each in its venues' own zone. */
  months: { label: string; count: number }[];
  /** Cities with the most events first, each with a zone for its local time. */
  cities: { name: string; timeZone: string; count: number }[];
};

/** The home page's numbers: how many events, venues and cities are coming up, by month and city. */
export async function upcomingSummary(): Promise<UpcomingSummary> {
  const { data, error } = await createSupabaseClient()
    .from("published_events")
    .select("starts_at, venue_timezone, venue_name, venue_city")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1000);
  if (error) throw error;
  const rows = (data ?? []) as Row[];
  const months: UpcomingSummary["months"] = [];
  const cities: UpcomingSummary["cities"] = [];
  const venues = new Set<string>();
  for (const row of rows) {
    const timeZone = text(row, "venue_timezone");
    const label = monthLabel(text(row, "starts_at"), timeZone);
    const month = months.find((known) => known.label === label);
    if (month) month.count += 1;
    else months.push({ label, count: 1 });
    const name = text(row, "venue_city");
    const city = cities.find((known) => known.name === name);
    if (city) city.count += 1;
    else cities.push({ name, timeZone, count: 1 });
    venues.add(`${text(row, "venue_name")}|${name}`);
  }
  cities.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return { events: rows.length, venues: venues.size, months, cities };
}

/** Every upcoming published event's address and last change, for the sitemap. */
export async function sitemapEvents() {
  const { data, error } = await createSupabaseClient()
    .from("published_events")
    .select("public_id, slug, updated_at")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(10000);
  if (error) throw error;
  return ((data ?? []) as Row[]).map((row) => ({
    path: eventPath(text(row, "slug"), text(row, "public_id")),
    updatedAt: text(row, "updated_at"),
  }));
}
