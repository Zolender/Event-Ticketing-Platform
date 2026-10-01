import assert from "node:assert/strict";
import { test } from "node:test";
import type { VenueWithEvents } from "@/features/venues/types";
import { duplicateOf, venueChangeImpact } from "@/features/venues/venue-impact";

const venue: VenueWithEvents = {
  id: "v1",
  name: "Kimihurura Jazz Lounge",
  address: "KG 5 Ave",
  city: "Kigali",
  country: "Rwanda",
  timezone: "Africa/Kigali",
  events: [
    {
      id: "e0",
      title: "Old Show",
      status: "published",
      startsAt: "2026-08-01T17:00:00Z",
      past: true,
    },
    {
      id: "e1",
      title: "Kigali Jazz Night",
      status: "published",
      startsAt: "2026-10-13T17:30:00Z",
      past: false,
    },
    {
      id: "e2",
      title: "Acoustic Evenings",
      status: "draft",
      startsAt: "2026-11-10T16:00:00Z",
      past: false,
    },
  ],
};
const same = {
  name: venue.name,
  address: venue.address,
  city: venue.city,
  country: venue.country,
  timezone: venue.timezone,
};

test("no change, nothing to say", () => {
  assert.deepEqual(venueChangeImpact(venue, same), []);
});

test("a zone change: times stay as typed, ended events keep theirs, the public sees it", () => {
  assert.deepEqual(
    venueChangeImpact(venue, { ...same, timezone: "Africa/Nairobi" }),
    [
      "Times stay as typed: “Kigali Jazz Night” stays at 19:30, now Nairobi time, and so does the other event to come.",
      "The event that has ended keeps its recorded time.",
      "2 published events show the change on the public site at once.",
    ],
  );
});

test("an address change on a venue with only drafts", () => {
  const drafts = { ...venue, events: [venue.events[2]] };
  assert.deepEqual(
    venueChangeImpact(drafts, { ...same, address: "KG 7 Ave" }),
    ["Only drafts use this venue, so nothing public changes."],
  );
});

test("a venue nobody uses changes freely", () => {
  assert.deepEqual(
    venueChangeImpact(
      { ...venue, events: [] },
      { ...same, timezone: "Europe/London" },
    ),
    [],
  );
});

test("spaces around a value are not a change", () => {
  assert.deepEqual(venueChangeImpact(venue, { ...same, city: " Kigali " }), []);
});

test("duplicates: same name and city, whatever the case, never itself", () => {
  const venues = [venue, { ...venue, id: "v2", city: "Nairobi" }];
  assert.equal(
    duplicateOf(venues, { name: "kimihurura jazz lounge ", city: "KIGALI" })
      ?.id,
    "v1",
  );
  assert.equal(
    duplicateOf(venues, { name: venue.name, city: "Kigali" }, "v1"),
    undefined,
  );
  assert.equal(
    duplicateOf(venues, { name: venue.name, city: "Kampala" }),
    undefined,
  );
  assert.equal(duplicateOf(venues, { name: "", city: "Kigali" }), undefined);
});
