import { NextResponse } from "next/server";
import { rejectCrossSiteWrite } from "@/server/http";
import { createSupabaseServerClient } from "@/server/supabase";

export async function POST(request: Request) {
  const rejected = rejectCrossSiteWrite(request);
  if (rejected) return rejected;

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
