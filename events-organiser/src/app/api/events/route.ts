import { NextResponse } from "next/server";
import { saveEvent } from "@/features/events/server/event-writes";
import { listMyEvents } from "@/features/events/server/events";
import { getOrganiser } from "@/server/auth";
import { problem, rejectCrossSiteWrite, refused } from "@/server/http";

export async function GET() {
  const organiser = await getOrganiser();
  if (!organiser)
    return problem(401, "session_ended", "Sign in again to continue.");
  return NextResponse.json(await listMyEvents(organiser));
}

export async function POST(request: Request) {
  const rejected = rejectCrossSiteWrite(request);
  if (rejected) return rejected;
  const organiser = await getOrganiser();
  if (!organiser)
    return problem(401, "session_ended", "Sign in again to continue.");

  const result = await saveEvent(
    organiser,
    await request.json().catch(() => null),
  );
  if (!result.ok) return refused(result);
  return NextResponse.json({ id: result.id }, { status: 201 });
}
