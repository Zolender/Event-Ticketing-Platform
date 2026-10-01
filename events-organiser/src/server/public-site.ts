import "server-only";

/** The public site, for links to an event's public page. A link only: the apps never call each other. */
export function publicSiteUrl() {
  return new URL(process.env.PUBLIC_SITE_URL ?? "http://localhost:3000");
}
