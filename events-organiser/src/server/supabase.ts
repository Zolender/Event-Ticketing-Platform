import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "./database.types";
import { supabaseCookieOptions, supabaseEnv } from "./supabase-config";

/** A Supabase client acting as the signed-in organiser, so row-level security applies. */
export const createSupabaseServerClient = cache(async () => {
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();

  return createServerClient<Database>(url, key, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot set cookies; proxy.ts refreshes the session instead.
        }
      },
    },
  });
});
