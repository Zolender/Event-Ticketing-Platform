import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cutAtWord,
  eventDescription,
  eventStructuredData,
  eventTitle,
  scriptJson,
} from "@/features/events/seo";
import type { EventDetail } from "@/features/events/types";

const event: EventDetail = {
  publicId: "8f3k2a9b",
  slug: "jazz-on-the-hill",
  path: "/events/jazz-on-the-hill-8f3k2a9b",
  title: "Jazz on the Hill",
  startsAt: "2026-10-17T17:30:00Z",
  timeZone: "Africa/Kigali",
  venueName: "Kimihurura Jazz Lounge",
  venueAddress: "KG 5 Ave",
  city: "Kigali",
  country: "Rwanda",
  currency: "RWF",
  prices: { min: 6000, max: 20000 },
  description: "An evening of live jazz.\n\nDoors open at 18:30.",
  organiserName: "Kigali Live Collective",
  tiers: [
    { name: "Early bird", price: 6000, capacity: 40 },
    { name: "VIP", price: 20000, capacity: 20 },
  ],
  updatedAt: "2026-10-01T10:00:00Z",
  past: false,
};
const site = new URL("https://tiketi.example");

test("the title carries the city", () => {
  assert.equal(eventTitle(event), "Jazz on the Hill, Kigali");
});

test("the description leads with when and where, on one line", () => {
  assert.equal(
    eventDescription(event),
    "Sat 17 Oct 2026, 19:30 at Kimihurura Jazz Lounge, Kigali. An evening of live jazz. Doors open at 18:30.",
  );
});

test("an ended event says so first", () => {
  assert.match(
    eventDescription({ ...event, past: true }),
    /^This event has ended\. Sat 17 Oct 2026/,
  );
});

test("long descriptions are cut at a word, near 155 characters", () => {
  const long = eventDescription({ ...event, description: "word ".repeat(80) });
  assert.ok(long.length <= 155, String(long.length));
  assert.match(long, /word…$/);
  assert.equal(cutAtWord("short", 155), "short");
  assert.equal(cutAtWord("x".repeat(200), 10), `${"x".repeat(9)}…`);
});

test("structured data: start with the venue's offset, one offer per tier, no availability", () => {
  const [data, crumbs] = eventStructuredData(event, site) as unknown as [
    Record<string, unknown> & { offers: Record<string, unknown>[] },
    { itemListElement: { item: string }[] },
  ];
  assert.equal(data.startDate, "2026-10-17T19:30:00+02:00");
  assert.equal(
    data.url,
    "https://tiketi.example/events/jazz-on-the-hill-8f3k2a9b",
  );
  assert.deepEqual(
    data.offers.map((offer) => [offer.name, offer.price, offer.priceCurrency]),
    [
      ["Early bird", "6000", "RWF"],
      ["VIP", "20000", "RWF"],
    ],
  );
  assert.ok(data.offers.every((offer) => !("availability" in offer)));
  assert.equal(crumbs.itemListElement[0].item, "https://tiketi.example/events");
});

test("organiser text cannot close the script tag", () => {
  const json = scriptJson({
    description: "</script><script>alert(1)</script> & \u2028",
  });
  assert.ok(!json.includes("<"));
  assert.ok(!json.includes(">"));
  assert.deepEqual(JSON.parse(json), {
    description: "</script><script>alert(1)</script> & \u2028",
  });
});
