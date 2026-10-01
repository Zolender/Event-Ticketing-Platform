import "server-only";
import type { Organiser } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase";
import type { Venue } from "../types";

// As with events: the verified organiser is required, row-level security applies, and the
// explicit organiser filter is the second layer.

export async function listMyVenues(organiser: Organiser): Promise<Venue[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("venues")
    .select("id, name, address, city, country, timezone")
    .eq("organiser_id", organiser.id)
    .order("name", { ascending: true });
  if (error) throw error;
  return data;
}
