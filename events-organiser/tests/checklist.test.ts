import assert from "node:assert/strict";
import { test } from "node:test";
import { missingText, publishChecklist } from "@/features/events/checklist";
import type { EventDetail } from "@/features/events/types";

const event: EventDetail = {
  id: "e",
  title: "Jazz",
  status: "draft",
  startsAt: "2026-11-10T17:30:00Z",
  past: false,
  currency: "RWF",
  description: null,
  firstPublishedAt: null,
  venue: {
    id: "v",
    name: "Hall",
    address: "KG 1",
    city: "Kigali",
    country: "Rwanda",
    timezone: "Africa/Kigali",
  },
  prices: null,
  tiers: [],
};

test("a new draft needs a description and a tier", () => {
  const items = publishChecklist(event);
  assert.deepEqual(
    items.filter((item) => !item.done).map((item) => item.key),
    ["description", "tiers"],
  );
  assert.equal(
    missingText(items),
    "a description and at least one ticket tier",
  );
});

test("a blank description does not count", () => {
  const items = publishChecklist({ ...event, description: "   " });
  assert.equal(items.find((item) => item.key === "description")?.done, false);
});

test("a passed date is on the list; three missing read naturally", () => {
  const items = publishChecklist({ ...event, past: true });
  assert.equal(
    missingText(items),
    "a description, a date to come and at least one ticket tier",
  );
});

test("a complete event has nothing missing", () => {
  const items = publishChecklist({
    ...event,
    description: "Live jazz.",
    tiers: [{ id: "t", name: "Regular", price: 1000, capacity: 10 }],
  });
  assert.ok(items.every((item) => item.done));
  assert.equal(missingText(items), "");
});
