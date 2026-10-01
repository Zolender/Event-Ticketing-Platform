import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatDate,
  formatDateTime,
  formatFromPrice,
  formatPrice,
  formatPriceRange,
  isoWithOffset,
  majorUnits,
  monthLabel,
  stubDate,
  zoneCity,
  zoneOffset,
} from "@/features/events/format";

test("dates are the venue's wall clock, with the year always", () => {
  assert.equal(
    formatDateTime("2026-10-17T17:30:00Z", "Africa/Kigali"),
    "Sat 17 Oct 2026, 19:30",
  );
  assert.equal(
    formatDate("2026-12-31T22:30:00Z", "Africa/Kigali"),
    "Fri 1 Jan 2027",
  );
  assert.deepEqual(stubDate("2026-10-17T17:30:00Z", "Africa/Kigali"), {
    weekday: "Sat",
    day: "17",
    monthYear: "Oct 2026",
  });
});

test("London follows its clock changes", () => {
  assert.equal(
    formatDateTime("2026-07-01T18:00:00Z", "Europe/London"),
    "Wed 1 Jul 2026, 19:00",
  );
  assert.equal(
    formatDateTime("2026-12-01T19:00:00Z", "Europe/London"),
    "Tue 1 Dec 2026, 19:00",
  );
});

test("months are the venue's own: 23:30 on 31 October in Kigali is still October", () => {
  assert.equal(
    monthLabel("2026-10-31T21:30:00Z", "Africa/Kigali"),
    "October 2026",
  );
  assert.equal(
    monthLabel("2026-10-31T22:30:00Z", "Africa/Kigali"),
    "November 2026",
  );
});

test("offsets for structured data, zero offset written in full", () => {
  assert.equal(zoneOffset("2026-10-17T17:30:00Z", "Africa/Kigali"), "+02:00");
  assert.equal(zoneOffset("2026-07-01T18:00:00Z", "Europe/London"), "+01:00");
  assert.equal(zoneOffset("2026-12-01T19:00:00Z", "Europe/London"), "+00:00");
  assert.equal(
    zoneOffset("2026-12-01T19:00:00Z", "America/New_York"),
    "-05:00",
  );
  assert.equal(zoneOffset("2026-12-01T19:00:00Z", "Asia/Kolkata"), "+05:30");
  assert.equal(
    isoWithOffset("2026-10-17T17:30:00Z", "Africa/Kigali"),
    "2026-10-17T19:30:00+02:00",
  );
  assert.equal(
    isoWithOffset("2026-12-01T19:00:00Z", "Europe/London"),
    "2026-12-01T19:00:00+00:00",
  );
});

test("zone names read as cities", () => {
  assert.equal(zoneCity("Africa/Kigali"), "Kigali");
  assert.equal(zoneCity("America/New_York"), "New York");
});

test("minor units to the currency's own decimals, on the digits", () => {
  assert.equal(majorUnits(8000, "RWF"), "8000");
  assert.equal(majorUnits(1250, "GBP"), "12.50");
  assert.equal(majorUnits(5, "GBP"), "0.05");
  assert.equal(majorUnits(0, "GBP"), "0.00");
  assert.equal(majorUnits(1500, "JPY"), "1500");
  assert.equal(majorUnits(12345, "KWD"), "12.345");
});

// Intl puts a non-breaking space after a currency code, so "RWF" never ends a line alone.
test("prices read the usual way, zero reads Free", () => {
  assert.equal(formatPrice(8000, "RWF"), "RWF\u00a08,000");
  assert.equal(formatPrice(1250, "GBP"), "£12.50");
  assert.equal(formatPrice(3000, "GBP"), "£30");
  assert.equal(formatPrice(0, "RWF"), "Free");
});

test("ranges and the hero's line", () => {
  assert.equal(
    formatPriceRange({ min: 6000, max: 20000 }, "RWF"),
    "RWF\u00a06,000 to RWF\u00a020,000",
  );
  assert.equal(formatPriceRange({ min: 0, max: 0 }, "RWF"), "Free");
  assert.equal(
    formatFromPrice({ min: 6000, max: 20000 }, "RWF"),
    "From RWF\u00a06,000",
  );
  assert.equal(
    formatFromPrice({ min: 8000, max: 8000 }, "RWF"),
    "RWF\u00a08,000",
  );
  assert.equal(
    formatFromPrice({ min: 0, max: 10000 }, "RWF"),
    "Free to RWF\u00a010,000",
  );
});
