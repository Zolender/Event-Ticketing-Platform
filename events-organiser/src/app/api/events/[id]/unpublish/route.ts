import { NextResponse } from "next/server";
import { setPublished } from "@/features/events/server/event-writes";
import { getMyEvent } from "@/features/events/server/events";
import { getOrganiser } from "@/server/auth";
import { problem, rejectCrossSiteWrite, refused } from "@/server/http";

/** Answers with the event as it now is, so the page shows the server's truth. */
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/events/[id]/unpublish">,
) {
  const rejected = rejectCrossSiteWrite(request);
  if (rejected) return rejected;
  const organiser = await getOrganiser();
  if (!organiser)
    return problem(401, "session_ended", "Sign in again to continue.");

  const { id } = await params;
  const result = await setPublished(organiser, id, false);
  if (!result.ok) return refused(result);
  return NextResponse.json(await getMyEvent(organiser, id));
}
