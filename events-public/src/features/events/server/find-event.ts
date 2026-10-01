import "server-only";
import { notFound, permanentRedirect } from "next/navigation";
import { publicIdFromSegment } from "../url";
import { getPublishedEvent } from "./events";

/**
 * One rule for an event's address, applied before anything is rendered so the status codes are
 * real: no such published event is a 404 (a draft too, and an id that cannot exist never reaches
 * the database); the exact canonical address is the event; any other address for the same event
 * (old slug, capitals, a bare id) is a 308 to the canonical one.
 */
export async function findEvent(segment: string) {
  const publicId = publicIdFromSegment(segment);
  if (!publicId) notFound();
  const event = await getPublishedEvent(publicId);
  if (!event) notFound();
  if (`/events/${segment}` !== event.path) permanentRedirect(event.path);
  return event;
}
