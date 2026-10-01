import { NextResponse } from "next/server";
import { renameOrganiser } from "@/features/account/server/account";
import { getOrganiser } from "@/server/auth";
import { problem, rejectCrossSiteWrite, refused } from "@/server/http";

/** Renames the organiser: the name the public sees on their events. */
export async function PATCH(request: Request) {
  const rejected = rejectCrossSiteWrite(request);
  if (rejected) return rejected;
  const organiser = await getOrganiser();
  if (!organiser)
    return problem(401, "session_ended", "Sign in again to continue.");

  const result = await renameOrganiser(
    organiser,
    await request.json().catch(() => null),
  );
  if (!result.ok) return refused(result);
  return NextResponse.json({ displayName: result.displayName });
}
