import "server-only";
import type { Organiser } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase";
import type { VenueWithEvents } from "../types";

// As with events: the verified organiser is required, row-level security applies, and the
// explicit organiser filter is the second layer.

/** The organiser's venues with the events using each: the event form's menu and the venues page. */
export async function listMyVenues(
  organiser: Organiser,
): Promise<VenueWithEvents[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("venues")
    .select(
      "id, name, address, city, country, timezone, events(id, title, status, starts_at)",
    )
    .eq("organiser_id", organiser.id)
    .order("name", { ascending: true })
    .order("starts_at", { referencedTable: "events", ascending: true });
  if (error) throw error;

  const now = Date.now();
  return data.map(({ events, ...venue }) => ({
    ...venue,
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      status: event.status,
      startsAt: event.starts_at,
      past: Date.parse(event.starts_at) <= now,
    })),
  }));
}
