import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeCursor, encodeCursor } from "@/features/events/cursor";
import {
  containsPattern,
  foldForSearch,
  normaliseSearch,
  SEARCH_MAX,
} from "@/features/events/search";

test("searches under two characters, or only spaces, are no search", () => {
  assert.equal(normaliseSearch(undefined), null);
  assert.equal(normaliseSearch(""), null);
  assert.equal(normaliseSearch("   "), null);
  assert.equal(normaliseSearch(" j "), null);
  assert.equal(normaliseSearch("ja"), "ja");
});

test("searches are trimmed, spaces collapsed, and capped", () => {
  assert.equal(normaliseSearch("  jazz    night "), "jazz night");
  assert.equal(normaliseSearch("x".repeat(500))?.length, SEARCH_MAX);
});

test("folding matches the database's lower(unaccent(...))", () => {
  assert.equal(foldForSearch("Café Noël"), "cafe noel");
  assert.equal(foldForSearch("MONTRÉAL"), "montreal");
  assert.equal(foldForSearch("Søren Œuvres"), "soren oeuvres");
  assert.equal(foldForSearch("Straße"), "strasse");
  assert.equal(foldForSearch("Łódź"), "lodz");
});

test("the visitor's wildcards mean themselves", () => {
  assert.equal(containsPattern("Jazz"), "%jazz%");
  assert.equal(containsPattern("100%"), "%100\\%%");
  assert.equal(containsPattern("a_b"), "%a\\_b%");
  assert.equal(containsPattern("back\\slash"), "%back\\\\slash%");
  assert.equal(containsPattern("a*b"), "%a_b%");
});

test("a cursor survives the round trip", () => {
  const cursor = {
    startsAt: "2026-10-17T17:30:00+00:00",
    publicId: "8f3k2a9b",
  };
  assert.deepEqual(decodeCursor(encodeCursor(cursor)), cursor);
});

test("a cursor not made by us is refused", () => {
  const forge = (text: string) => Buffer.from(text).toString("base64url");
  for (const value of [
    null,
    "",
    "not-base64-at-all!",
    forge("2026-10-17T17:30:00+00:00"),
    forge("2026-10-17T17:30:00+00:00|8f3k2a9b|extra"),
    forge("yesterday|8f3k2a9b"),
    forge("2026-13-45T99:99:99+00:00|8f3k2a9b"),
    forge("2026-10-17T17:30:00+00:00|8f3k2a9b),public_id.gt.("),
    forge('2026-10-17T17:30:00+00:00",x|8f3k2a9b'),
    "x".repeat(200),
  ])
    assert.equal(decodeCursor(value), null, String(value));
});
