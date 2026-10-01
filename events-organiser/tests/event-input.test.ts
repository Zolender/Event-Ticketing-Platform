import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  checkWhen,
  validateEvent,
  type EventInput,
} from "@/features/events/event-schema";
import { parseCapacity, parsePrice, priceInput } from "@/features/events/money";
import { slugify } from "@/features/events/slug";
import {
  allZones,
  currentZoneName,
  isZone,
  suggestZone,
  zoneCity,
} from "@/features/venues/zones";

describe("prices: typed in major units, stored in minor units", () => {
  test("francs have no smaller unit", () => {
    assert.deepEqual(parsePrice("8000", "RWF"), { ok: true, minor: 8000 });
    assert.deepEqual(parsePrice("8,000", "RWF"), { ok: true, minor: 8000 });
    assert.deepEqual(parsePrice("12.5", "RWF"), {
      ok: false,
      error: "RWF has no smaller unit. Enter a whole amount.",
    });
  });

  test("pounds have pence, worked on the digits so 0.1 + 0.2 never bites", () => {
    assert.deepEqual(parsePrice("12.50", "GBP"), { ok: true, minor: 1250 });
    assert.deepEqual(parsePrice("12.5", "GBP"), { ok: true, minor: 1250 });
    assert.deepEqual(parsePrice("0.29", "GBP"), { ok: true, minor: 29 });
    assert.deepEqual(parsePrice("19.99", "GBP"), { ok: true, minor: 1999 });
    assert.deepEqual(parsePrice("1.005", "GBP"), {
      ok: false,
      error: "Use at most 2 decimals.",
    });
  });

  test("free, empty, nonsense, negative and huge", () => {
    assert.deepEqual(parsePrice("0", "RWF"), { ok: true, minor: 0 });
    assert.equal(parsePrice("", "RWF").ok, false);
    assert.equal(parsePrice("abc", "RWF").ok, false);
    assert.equal(parsePrice("-5", "RWF").ok, false);
    assert.equal(parsePrice("1e3", "RWF").ok, false);
    assert.deepEqual(parsePrice("99999999999", "RWF"), {
      ok: false,
      error: "That price is too high.",
    });
  });

  test("back into the field as typed", () => {
    assert.equal(priceInput(1250, "GBP"), "12.50");
    assert.equal(priceInput(5, "GBP"), "0.05");
    assert.equal(priceInput(8000, "RWF"), "8000");
  });

  test("capacity", () => {
    assert.deepEqual(parseCapacity("200"), { ok: true, value: 200 });
    assert.deepEqual(parseCapacity("1,000"), { ok: true, value: 1000 });
    assert.equal(parseCapacity("0").ok, false);
    assert.equal(parseCapacity("2.5").ok, false);
    assert.equal(parseCapacity("1000001").ok, false);
  });
});

describe("slugs match the database's rule", () => {
  const rule = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const cases: [string, string][] = [
    ["Kigali Jazz Night", "kigali-jazz-night"],
    ["Café Noël: Édition 2", "cafe-noel-edition-2"],
    ["Rock & Roll", "rock-and-roll"],
    ["  --Hello--  ", "hello"],
    ["!!!", "event"],
    ["イベント", "event"],
  ];
  for (const [title, slug] of cases) {
    test(`${JSON.stringify(title)} becomes ${slug}`, () => {
      assert.equal(slugify(title), slug);
      assert.match(slugify(title), rule);
    });
  }
  test("long titles are cut without a trailing hyphen", () => {
    const slug = slugify("word ".repeat(40));
    assert.ok(slug.length <= 80);
    assert.match(slug, rule);
  });
});

describe("timezones", () => {
  test("old names are shown and saved under their current one", () => {
    assert.equal(currentZoneName("Asia/Calcutta"), "Asia/Kolkata");
    assert.equal(currentZoneName("Europe/Kiev"), "Europe/Kyiv");
    assert.equal(currentZoneName("Africa/Kigali"), "Africa/Kigali");
    assert.ok(allZones().includes("Asia/Kolkata"));
    assert.ok(!allZones().includes("Asia/Calcutta"));
  });

  test("validation accepts real zones under either name, refuses others", () => {
    assert.ok(isZone("Africa/Kigali"));
    assert.ok(isZone("Asia/Kolkata"));
    assert.ok(isZone("Asia/Calcutta"));
    assert.ok(!isZone("Mars/Base"));
    assert.ok(!isZone("UTC"));
    assert.ok(!isZone(""));
  });

  test("city names read well", () => {
    assert.equal(zoneCity("America/Argentina/Buenos_Aires"), "Buenos Aires");
  });

  test("a country suggests its zone only when it has one", () => {
    assert.deepEqual(suggestZone(" Rwanda "), {
      kind: "one",
      zone: "Africa/Kigali",
    });
    assert.deepEqual(suggestZone("United States"), { kind: "several" });
    assert.deepEqual(suggestZone("Atlantis"), { kind: "none" });
  });
});

const valid: EventInput = {
  title: "Kigali Jazz Night",
  description: "Live jazz.",
  venue: { kind: "existing", id: "a0000000-0000-4000-8000-00000000000a" },
  date: "2026-11-10",
  time: "19:30",
  currency: "RWF",
  tiers: [
    { name: "Regular", price: "10000", capacity: "200" },
    { name: "VIP", price: "30000", capacity: "40" },
  ],
};

describe("the event form's input", () => {
  test("a complete event passes and keeps its tiers in order", () => {
    const result = validateEvent(valid);
    assert.ok(result.ok);
    assert.deepEqual(
      result.event.tiers.map((tier) => tier.name),
      ["Regular", "VIP"],
    );
  });

  test("a draft may have no description and no tiers", () => {
    assert.ok(validateEvent({ ...valid, description: "", tiers: [] }).ok);
  });

  test("errors are keyed by field, worded as the fix", () => {
    const result = validateEvent({
      ...valid,
      title: "   ",
      date: "2026-02-30",
      time: "25:00",
      tiers: [{ name: "", price: "12.5", capacity: "0" }],
    });
    assert.ok(!result.ok);
    assert.deepEqual(result.errors, {
      title: "Give the event a title.",
      date: "Choose a date.",
      time: "Choose a time.",
      "tiers.0.name": "Name the tier.",
      "tiers.0.price": "RWF has no smaller unit. Enter a whole amount.",
      "tiers.0.capacity": "At least 1 ticket.",
    });
  });

  test("two tiers with the same name, whatever the case", () => {
    const result = validateEvent({
      ...valid,
      tiers: [
        { name: "Regular", price: "1", capacity: "1" },
        { name: " regular ", price: "1", capacity: "1" },
      ],
    });
    assert.ok(!result.ok);
    assert.equal(result.errors["tiers.1.name"], "Another tier has this name.");
  });

  test("prices are read in the chosen currency", () => {
    assert.ok(
      validateEvent({
        ...valid,
        currency: "GBP",
        tiers: [{ name: "A", price: "12.50", capacity: "5" }],
      }).ok,
    );
  });

  test("a new venue is checked like the venues page checks it", () => {
    const result = validateEvent({
      ...valid,
      venue: {
        kind: "new",
        name: "",
        address: "KN 4",
        city: "Kigali",
        country: "",
        timezone: "Mars/Base",
      },
    });
    assert.ok(!result.ok);
    assert.equal(result.errors["venue.name"], "Enter the venue name.");
    assert.equal(result.errors["venue.country"], "Enter the country.");
    assert.equal(
      result.errors["venue.timezone"],
      "Choose the venue's timezone.",
    );
  });

  test("a new venue's old zone name is saved under the current one", () => {
    const result = validateEvent({
      ...valid,
      venue: {
        kind: "new",
        name: "Hall",
        address: "1 Rd",
        city: "Pune",
        country: "India",
        timezone: "Asia/Calcutta",
      },
    });
    assert.ok(result.ok && result.event.venue.kind === "new");
    assert.equal(result.event.venue.timezone, "Asia/Kolkata");
  });

  test("limits", () => {
    assert.ok(!validateEvent({ ...valid, title: "x".repeat(201) }).ok);
    assert.ok(validateEvent({ ...valid, title: "x".repeat(200) }).ok);
    assert.ok(!validateEvent({ ...valid, description: "x".repeat(5001) }).ok);
    const tiers = Array.from({ length: 21 }, (_, i) => ({
      name: `T${i}`,
      price: "1",
      capacity: "1",
    }));
    assert.ok(!validateEvent({ ...valid, tiers }).ok);
  });

  test("a forged tier id is refused", () => {
    assert.ok(
      !validateEvent({
        ...valid,
        tiers: [{ id: "1; drop table", name: "A", price: "1", capacity: "1" }],
      }).ok,
    );
  });
});

describe("checkWhen: the date and time at the venue", () => {
  const now = Date.parse("2026-10-01T12:00:00Z");

  test("a future time gives its instant", () => {
    assert.deepEqual(
      checkWhen("2026-11-10", "19:30", "Africa/Kigali", now, false),
      {
        ok: true,
        iso: "2026-11-10T17:30:00.000Z",
      },
    );
  });

  test("a daylight saving gap is refused with a suggestion", () => {
    const result = checkWhen(
      "2027-03-28",
      "01:30",
      "Europe/London",
      now,
      false,
    );
    assert.deepEqual(result, {
      ok: false,
      field: "time",
      error:
        "01:30 doesn't exist on Sun 28 Mar 2027 in London: the clocks go forward. Try 02:30.",
      suggestion: "02:30",
    });
  });

  test("a passed date warns on a draft and blocks on a published event", () => {
    assert.deepEqual(
      checkWhen("2026-09-01", "19:30", "Africa/Kigali", now, false),
      {
        ok: true,
        iso: "2026-09-01T17:30:00.000Z",
        warning: "This date has passed.",
      },
    );
    assert.deepEqual(
      checkWhen("2026-09-01", "19:30", "Africa/Kigali", now, true),
      {
        ok: false,
        field: "date",
        error: "A published event needs a date in the future.",
      },
    );
  });

  test("an ended published event keeps its date and can still be corrected", () => {
    const stored = "2026-09-01T17:30:00+00:00";
    assert.deepEqual(
      checkWhen("2026-09-01", "19:30", "Africa/Kigali", now, true, stored),
      {
        ok: true,
        iso: "2026-09-01T17:30:00.000Z",
        warning: "This date has passed.",
      },
    );
    assert.equal(
      checkWhen("2026-09-02", "19:30", "Africa/Kigali", now, true, stored).ok,
      false,
    );
  });

  test("a stored time with seconds still counts as unchanged", () => {
    const stored = "2026-09-01T17:30:06.374Z";
    assert.equal(
      checkWhen("2026-09-01", "19:30", "Africa/Kigali", now, true, stored).ok,
      true,
    );
  });

  test("the same minute as now counts as passed", () => {
    assert.equal(
      checkWhen("2026-10-01", "14:00", "Africa/Kigali", now, true).ok,
      false,
    );
    assert.equal(
      checkWhen("2026-10-01", "14:01", "Africa/Kigali", now, true).ok,
      true,
    );
  });
});
