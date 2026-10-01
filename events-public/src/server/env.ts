import "server-only";

export function supabaseEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set.");
  }
  return { url, key };
}

/** This site's own address, for canonical links, previews and the sitemap. */
export function siteUrl() {
  return new URL(process.env.SITE_URL ?? "http://localhost:3000");
}
