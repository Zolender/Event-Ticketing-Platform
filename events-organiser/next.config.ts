import type { NextConfig } from "next";

// No page of this app may be framed by any site, so a hidden frame cannot trick an organiser into
// clicking Publish or Delete. The referrer never leaves the app: its addresses name events. The
// Content Security Policy is set per request in proxy.ts, with a nonce.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
