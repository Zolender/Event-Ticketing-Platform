import { NextResponse } from "next/server";
import {
  deleteVenue,
  updateVenue,
} from "@/features/venues/server/venue-writes";
import { getOrganiser } from "@/server/auth";
import { problem, rejectCrossSiteWrite, refused } from "@/server/http";

type Context = RouteContext<"/api/venues/[id]">;

export async function PATCH(request: Request, { params }: Context) {
  const rejected = rejectCrossSiteWrite(request);
  if (rejected) return rejected;
  const organiser = await getOrganiser();
  if (!organiser)
    return problem(401, "session_ended", "Sign in again to continue.");

  const result = await updateVenue(
    organiser,
    (await params).id,
    await request.json().catch(() => null),
  );
  if (!result.ok) return refused(result);
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(request: Request, { params }: Context) {
  // A DELETE has no body, so only the origin is checked; the cookie is SameSite as for every write.
  const rejected = rejectCrossSiteWrite(request, { body: false });
  if (rejected) return rejected;
  const organiser = await getOrganiser();
  if (!organiser)
    return problem(401, "session_ended", "Sign in again to continue.");

  const result = await deleteVenue(organiser, (await params).id);
  if (!result.ok) return refused(result);
  return new NextResponse(null, { status: 204 });
}
