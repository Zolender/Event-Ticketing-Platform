import type { MetadataRoute } from "next";
import { siteUrl } from "@/server/env";

// Everything public may be crawled; the API only serves the list page.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: new URL("/sitemap.xml", siteUrl()).href,
  };
}
