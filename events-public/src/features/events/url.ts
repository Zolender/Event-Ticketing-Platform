// An event's address is its slug and its public id: /events/jazz-on-the-hill-8f3k2a9b. The id
// finds the event; the slug is only there to be read, so an outdated one redirects.

/** 8 characters from the database's alphabet, which leaves out 0, 1, l and o. */
const PUBLIC_ID = /^[abcdefghijkmnpqrstuvwxyz23456789]{8}$/;

export function isPublicId(value: string) {
  return PUBLIC_ID.test(value);
}

/**
 * The public id in a URL segment: whatever follows the last hyphen, or the whole segment for a
 * bare id. Null when it cannot be an id, so the database is never asked.
 */
export function publicIdFromSegment(segment: string) {
  const candidate = segment.slice(segment.lastIndexOf("-") + 1);
  return isPublicId(candidate) ? candidate : null;
}

export function eventPath(slug: string, publicId: string) {
  return `/events/${slug}-${publicId}`;
}
