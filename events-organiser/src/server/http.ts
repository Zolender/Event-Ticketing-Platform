import "server-only";
import { NextResponse } from "next/server";

/**
 * An error answer: `code` is for the page to choose its own wording, `message` is a plain fallback
 * for anything else that calls the API.
 */
export function problem(status: number, code: string, message: string) {
  return NextResponse.json({ code, message }, { status });
}

/**
 * Call first in every write handler. With the SameSite session cookie, this makes three layers
 * against cross-site request forgery: a request from another site has the wrong Origin, and an
 * HTML form cannot send JSON. Returns a response to send back, or null to carry on.
 */
export function rejectCrossSiteWrite(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) {
    return problem(
      403,
      "cross_site",
      "Requests from other sites are not allowed.",
    );
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return problem(415, "not_json", "Requests must be sent as JSON.");
  }
  return null;
}
