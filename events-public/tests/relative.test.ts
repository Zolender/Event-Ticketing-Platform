import assert from "node:assert/strict";
import { test } from "node:test";
import { countdownLabel, visitorTime } from "@/features/events/relative";

const KIGALI = "Africa/Kigali";
// Sat 17 Oct 2026, 19:30 in Kigali.
const EVENING = "2026-10-17T17:30:00Z";

test("the countdown follows the venue's calendar", () => {
  assert.equal(
    countdownLabel(EVENING, KIGALI, Date.parse("2026-10-01T10:00:00Z")),
    "In 16 days",
  );
  assert.equal(
    countdownLabel(EVENING, KIGALI, Date.parse("2026-10-16T21:59:00Z")),
    "Tomorrow",
  );
  // 00:01 on the 17th in Kigali is still 22:01 on the 16th in UTC.
  assert.equal(
    countdownLabel(EVENING, KIGALI, Date.parse("2026-10-16T22:01:00Z")),
    "Tonight",
  );
  assert.equal(
    countdownLabel(
      "2026-10-17T08:00:00Z",
      KIGALI,
      Date.parse("2026-10-17T06:00:00Z"),
    ),
    "Today",
  );
});

test("no countdown once the event has started", () => {
  assert.equal(countdownLabel(EVENING, KIGALI, Date.parse(EVENING)), null);
  assert.equal(
    countdownLabel(EVENING, KIGALI, Date.parse("2026-10-18T00:00:00Z")),
    null,
  );
});

test("the visitor's time shows only when it reads differently", () => {
  assert.equal(visitorTime(EVENING, KIGALI, KIGALI), null);
  // Johannesburg shares Kigali's offset: same wall clock, nothing to add.
  assert.equal(visitorTime(EVENING, KIGALI, "Africa/Johannesburg"), null);
  assert.equal(
    visitorTime(EVENING, KIGALI, "Europe/London"),
    "18:30 your time (London)",
  );
});

test("the date is added when the visitor's day differs", () => {
  assert.equal(
    visitorTime(EVENING, KIGALI, "Asia/Tokyo"),
    "Sun 18 Oct 2026, 02:30 your time (Tokyo)",
  );
  assert.equal(
    visitorTime("2026-10-17T00:30:00Z", KIGALI, "America/New_York"),
    "Fri 16 Oct 2026, 20:30 your time (New York)",
  );
});
