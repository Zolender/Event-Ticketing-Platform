import assert from "node:assert/strict";
import { test } from "node:test";
import { eventPath, publicIdFromSegment } from "@/features/events/url";

test("the id is whatever follows the last hyphen", () => {
  assert.equal(publicIdFromSegment("jazz-on-the-hill-8f3k2a9b"), "8f3k2a9b");
  assert.equal(publicIdFromSegment("cafe-noel-edition-2-8f3k2a9b"), "8f3k2a9b");
});

test("a bare id and an empty slug still find the event", () => {
  assert.equal(publicIdFromSegment("8f3k2a9b"), "8f3k2a9b");
  assert.equal(publicIdFromSegment("-8f3k2a9b"), "8f3k2a9b");
});

test("anything that cannot be an id is refused before the database", () => {
  for (const segment of [
    "jazz-8f3k2a9",
    "jazz-8f3k2a9bb",
    "jazz-8F3K2A9B",
    "jazz-8f3k2a0b",
    "jazz-8f3k2a1b",
    "jazz-8f3k2alb",
    "jazz-8f3k2aob",
    "jazz-",
    "",
    "jazz on the hill",
    "jazz-8f3k2a9%",
  ])
    assert.equal(publicIdFromSegment(segment), null, segment);
});

test("the canonical path joins slug and id", () => {
  assert.equal(
    eventPath("jazz-on-the-hill", "8f3k2a9b"),
    "/events/jazz-on-the-hill-8f3k2a9b",
  );
});
