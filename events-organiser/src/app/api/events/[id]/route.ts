import { NextResponse } from "next/server";
import { deleteEvent, saveEvent } from "@/features/events/server/event-writes";
import { getMyEvent } from "@/features/events/server/events";
import { getOrganiser } from "@/server/auth";
import { problem, rejectCrossSiteWrite, refused } from "@/server/http";

type Context = RouteContext<"/api/events/[id]">;

export async function GET(_request: Request, { params }: Context) {
  const organiser = await getOrganiser();
  if (!organiser)
    return problem(401, "session_ended", "Sign in again to continue.");

  const event = await getMyEvent(organiser, (await params).id);
  // Missing and someone else's look the same, so nothing reveals that an event exists.
  if (!event) return problem(404, "not_found", "This event does not exist.");
  return NextResponse.json(event);
}

/** Saves the whole form, and answers with the event as it now is. */
export async function PATCH(request: Request, { params }: Context) {
  const rejected = rejectCrossSiteWrite(request);
  if (rejected) return rejected;
  const organiser = await getOrganiser();
  if (!organiser)
    return problem(401, "session_ended", "Sign in again to continue.");

  const { id } = await params;
  const result = await saveEvent(
    organiser,
    await request.json().catch(() => null),
    id,
  );
  if (!result.ok) return refused(result);
  return NextResponse.json(await getMyEvent(organiser, id));
}

export async function DELETE(request: Request, { params }: Context) {
  // A DELETE has no body, so only the origin is checked; the cookie is SameSite as for every write.
  const rejected = rejectCrossSiteWrite(request, { body: false });
  if (rejected) return rejected;
  const organiser = await getOrganiser();
  if (!organiser)
    return problem(401, "session_ended", "Sign in again to continue.");

  const result = await deleteEvent(organiser, (await params).id);
  if (!result.ok) return refused(result);
  return new NextResponse(null, { status: 204 });
}
