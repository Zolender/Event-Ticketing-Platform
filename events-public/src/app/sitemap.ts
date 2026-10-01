import type { MetadataRoute } from "next";
import { sitemapEvents } from "@/features/events/server/events";
import { siteUrl } from "@/server/env";

// Home, the list, and every upcoming published event. Ended events keep their pages for links
// already shared, but leave the sitemap; drafts were never in it.
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteUrl();
  const events = await sitemapEvents();
  return [
    { url: new URL("/", site).href },
    { url: new URL("/events", site).href },
    ...events.map((event) => ({
      url: new URL(event.path, site).href,
      lastModified: event.updatedAt,
    })),
  ];
}
