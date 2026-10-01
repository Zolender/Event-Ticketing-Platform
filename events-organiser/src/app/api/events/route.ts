import { NextResponse } from "next/server";
import { listMyEvents } from "@/features/events/server/events";
import { getOrganiser } from "@/server/auth";
import { problem } from "@/server/http";

export async function GET() {
  const organiser = await getOrganiser();
  if (!organiser)
    return problem(401, "session_ended", "Sign in again to continue.");
  return NextResponse.json(await listMyEvents(organiser));
}
