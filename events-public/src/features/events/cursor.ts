import { isPublicId } from "./url";

// "The events after this one": its start time, then its public id to break ties between events
// that start at the same moment. Opaque to the browser, checked strictly when it comes back,
// because it ends up inside a database filter.

export type Cursor = { startsAt: string; publicId: string };

export function encodeCursor(cursor: Cursor) {
  return Buffer.from(`${cursor.startsAt}|${cursor.publicId}`).toString(
    "base64url",
  );
}

const INSTANT =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;

/** The cursor, or null when it was not made by encodeCursor. */
export function decodeCursor(value: string | null | undefined): Cursor | null {
  if (!value || value.length > 100) return null;
  const text = Buffer.from(value, "base64url").toString("utf8");
  const [startsAt, publicId, ...rest] = text.split("|");
  if (rest.length || !startsAt || !publicId) return null;
  if (!INSTANT.test(startsAt) || Number.isNaN(Date.parse(startsAt)))
    return null;
  if (!isPublicId(publicId)) return null;
  return { startsAt, publicId };
}
