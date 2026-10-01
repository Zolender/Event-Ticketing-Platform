import { NextResponse } from "next/server";
import { signInSchema } from "@/features/auth/sign-in-schema";
import { problem, rejectCrossSiteWrite } from "@/server/http";
import { createSupabaseServerClient } from "@/server/supabase";

export async function POST(request: Request) {
  const rejected = rejectCrossSiteWrite(request);
  if (rejected) return rejected;

  const parsed = signInSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return problem(400, "invalid_input", "Enter your email and password.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error?.status === 429) {
    return problem(
      429,
      "rate_limited",
      "Too many attempts. Try again in a minute.",
    );
  }
  // One answer for every other failure, so it never reveals which emails have accounts.
  if (error) {
    return problem(401, "invalid_credentials", "Wrong email or password.");
  }

  return NextResponse.json({ ok: true });
}
