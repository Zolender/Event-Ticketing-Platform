import type { MetadataRoute } from "next";

// A private app: nothing here belongs in search results.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
