import { NextResponse } from "next/server";
import { changePassword } from "@/features/account/server/account";
import { getOrganiser } from "@/server/auth";
import { problem, rejectCrossSiteWrite, refused } from "@/server/http";

export async function POST(request: Request) {
  const rejected = rejectCrossSiteWrite(request);
  if (rejected) return rejected;
  const organiser = await getOrganiser();
  if (!organiser)
    return problem(401, "session_ended", "Sign in again to continue.");

  const result = await changePassword(
    organiser,
    await request.json().catch(() => null),
  );
  if (!result.ok) return refused(result);
  return NextResponse.json({ ok: true });
}
