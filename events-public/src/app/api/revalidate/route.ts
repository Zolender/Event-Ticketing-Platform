import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// Called by the database (a trigger through pg_net) when a published event changes. One change can
// show on its page, its preview image, home, the list, the sitemap and other events' "More
// events", so every cached page is expired; each is made again on its next visit. The secret
// header is all that guards it, and the worst a leaked secret allows is pages made again early.
export async function POST(request: Request) {
  const expected = process.env.REVALIDATE_SECRET;
  const given = request.headers.get("x-revalidate-secret") ?? "";
  if (!expected || !sameSecret(given, expected)) {
    return NextResponse.json(
      { code: "unauthorised", message: "Not allowed." },
      { status: 401 },
    );
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ revalidated: true });
}

/** Compared in constant time, so the answer's timing gives nothing away. */
function sameSecret(given: string, expected: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(given), digest(expected));
}
