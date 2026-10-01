import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Supabase as an anonymous visitor, with the publishable key: it can read the published_events
 * view and nothing else. Nobody signs in on this site, so no session and no cookies.
 */
export function createSupabaseClient() {
  const { url, key } = supabaseEnv();
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
