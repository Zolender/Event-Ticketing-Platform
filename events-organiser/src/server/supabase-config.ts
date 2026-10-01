import "server-only";
import type { CookieOptionsWithName } from "@supabase/ssr";

// Nothing in the browser reads the session, so JavaScript is never allowed to.
export const supabaseCookieOptions: CookieOptionsWithName = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export function supabaseEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set.");
  }
  return { url, key };
}
