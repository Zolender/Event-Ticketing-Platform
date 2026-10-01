import { NextResponse } from "next/server";
import { getMyEvent } from "@/features/events/server/events";
import { getOrganiser } from "@/server/auth";
import { problem } from "@/server/http";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/events/[id]">,
) {
  const organiser = await getOrganiser();
  if (!organiser)
    return problem(401, "session_ended", "Sign in again to continue.");

  const event = await getMyEvent(organiser, (await params).id);
  // Missing and someone else's look the same, so nothing reveals that an event exists.
  if (!event) return problem(404, "not_found", "This event does not exist.");
  return NextResponse.json(event);
}
