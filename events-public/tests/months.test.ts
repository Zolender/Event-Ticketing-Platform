import assert from "node:assert/strict";
import { test } from "node:test";
import { groupByMonth } from "@/features/events/months";
import type { EventCard } from "@/features/events/types";

const card = (
  publicId: string,
  startsAt: string,
  timeZone = "Africa/Kigali",
): EventCard => ({
  publicId,
  path: `/events/e-${publicId}`,
  title: publicId,
  startsAt,
  timeZone,
  venueName: "Hall",
  city: "Kigali",
  currency: "RWF",
  prices: null,
});

test("one heading per month, in order", () => {
  const groups = groupByMonth([
    card("a", "2026-10-03T17:00:00Z"),
    card("b", "2026-10-20T17:00:00Z"),
    card("c", "2026-11-02T17:00:00Z"),
  ]);
  assert.deepEqual(
    groups.map((group) => [group.label, group.events.map((e) => e.publicId)]),
    [
      ["October 2026", ["a", "b"]],
      ["November 2026", ["c"]],
    ],
  );
});

test("the month is the venue's: 23:30 on 31 October in Kigali stays in October", () => {
  const [group] = groupByMonth([card("a", "2026-10-31T21:30:00Z")]);
  assert.equal(group.label, "October 2026");
});

test("a month continuing after more events load keeps a single heading", () => {
  const first = [card("a", "2026-10-03T17:00:00Z")];
  const more = [card("b", "2026-10-20T17:00:00Z")];
  assert.equal(groupByMonth([...first, ...more]).length, 1);
});

test("nothing loaded, no headings", () => {
  assert.deepEqual(groupByMonth([]), []);
});
