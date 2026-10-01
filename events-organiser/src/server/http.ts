import "server-only";
import { NextResponse } from "next/server";

/**
 * An error answer: `code` is for the page to choose its own wording, `message` is a plain fallback
 * for anything else that calls the API. `extra` carries details such as per-field errors.
 */
export function problem(
  status: number,
  code: string,
  message: string,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ code, message, ...extra }, { status });
}

/**
 * Call first in every write handler. With the SameSite session cookie, this makes three layers
 * against cross-site request forgery: a request from another site has the wrong Origin, and an
 * HTML form cannot send JSON. Returns a response to send back, or null to carry on.
 */
export function rejectCrossSiteWrite(
  request: Request,
  { body = true }: { body?: boolean } = {},
): NextResponse | null {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) {
    return problem(
      403,
      "cross_site",
      "Requests from other sites are not allowed.",
    );
  }
  if (
    body &&
    !request.headers.get("content-type")?.startsWith("application/json")
  ) {
    return problem(415, "not_json", "Requests must be sent as JSON.");
  }
  return null;
}

/** A refusal from a data access function, as an error answer. */
export function refused({
  status,
  code,
  message,
  ...extra
}: {
  status: number;
  code: string;
  message: string;
  ok?: false;
  [key: string]: unknown;
}) {
  delete extra.ok;
  return problem(status, code, message, extra);
}
