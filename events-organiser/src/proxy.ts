import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseCookieOptions, supabaseEnv } from "@/server/supabase-config";

// Comfort, not security: it refreshes the session and saves a round trip to the sign-in page.
// Every page and route handler checks the organiser itself (server/auth.ts), and the database's
// policies check again. It also sets the Content Security Policy, with a nonce made per request.
export async function proxy(request: NextRequest) {
  // Next reads the policy from the request to stamp the nonce on its own scripts; the browser
  // reads it from the response. Every page here is rendered per request, so this costs nothing.
  const policy = contentSecurityPolicy(
    Buffer.from(crypto.randomUUID()).toString("base64"),
  );
  request.headers.set("Content-Security-Policy", policy);
  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

  const supabase = createServerClient(url, key, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const onSignIn = request.nextUrl.pathname === "/sign-in";

  if (!signedIn && !onSignIn) {
    // A session cookie that no longer verifies means the session ended, not a first visit.
    const hadSession = request.cookies
      .getAll()
      .some(
        ({ name }) => name.startsWith("sb-") && name.includes("-auth-token"),
      );
    const target = hadSession ? "/sign-in?reason=session-ended" : "/sign-in";
    return withPolicy(
      redirectKeepingCookies(request, target, response),
      policy,
    );
  }
  if (signedIn && onSignIn) {
    // A session ended elsewhere (signed out everywhere) keeps a valid-looking token until it
    // expires, and the pages would send it back here in a loop. On the sign-in page only, ask
    // Auth itself; if the session has ended, clear its cookies and show the page.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user)
      return withPolicy(
        redirectKeepingCookies(request, "/events", response),
        policy,
      );
    await supabase.auth.signOut({ scope: "local" });
  }
  return withPolicy(response, policy);
}

/**
 * Only scripts carrying this request's nonce run (and what they load), so an injected script
 * cannot act as the signed-in organiser. Styles may be inline: components set animation delays in
 * style attributes, and a style cannot run code. Nothing is loaded from or sent to another site.
 */
function contentSecurityPolicy(nonce: string) {
  const dev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${dev ? " ws:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

function withPolicy(response: NextResponse, policy: string) {
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

// A refreshed session must survive the redirect.
function redirectKeepingCookies(
  request: NextRequest,
  path: string,
  from: NextResponse,
) {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  // Route handlers answer 401 themselves; static files need no session.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
