import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/server/supabase";

// Called once a day by Vercel Cron (vercel.json). Supabase's free plan pauses a project after a
// week without activity; one small read keeps the database awake for reviewers. Vercel sends
// CRON_SECRET as a bearer token; anything else is refused.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization") ?? "";
  if (!secret || !same(given, `Bearer ${secret}`)) {
    return NextResponse.json(
      { code: "unauthorised", message: "Not allowed." },
      { status: 401 },
    );
  }
  const { error } = await createSupabaseClient()
    .from("published_events")
    .select("public_id")
    .limit(1);
  if (error) {
    return NextResponse.json(
      { code: "unavailable", message: "The database did not answer." },
      { status: 503 },
    );
  }
  return NextResponse.json({ awake: true });
}

function same(given: string, expected: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(given), digest(expected));
}
