import { NextResponse } from "next/server";
import { createVenue } from "@/features/venues/server/venue-writes";
import { listMyVenues } from "@/features/venues/server/venues";
import { getOrganiser } from "@/server/auth";
import { problem, rejectCrossSiteWrite, refused } from "@/server/http";

export async function GET() {
  const organiser = await getOrganiser();
  if (!organiser)
    return problem(401, "session_ended", "Sign in again to continue.");
  return NextResponse.json(await listMyVenues(organiser));
}

export async function POST(request: Request) {
  const rejected = rejectCrossSiteWrite(request);
  if (rejected) return rejected;
  const organiser = await getOrganiser();
  if (!organiser)
    return problem(401, "session_ended", "Sign in again to continue.");

  const result = await createVenue(
    organiser,
    await request.json().catch(() => null),
  );
  if (!result.ok) return refused(result);
  return NextResponse.json({ id: result.id }, { status: 201 });
}
