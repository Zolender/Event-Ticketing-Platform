import { NextResponse } from "next/server";
import { rejectCrossSiteWrite } from "@/server/http";
import { createSupabaseServerClient } from "@/server/supabase";

/** Signs out this session, or with `{ "everywhere": true }` every session of the account. */
export async function POST(request: Request) {
  const rejected = rejectCrossSiteWrite(request);
  if (rejected) return rejected;

  const body = await request.json().catch(() => ({}));
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: body?.everywhere ? "global" : "local" });
  return NextResponse.json({ ok: true });
}
