import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  addMonths,
  formatPlainDate,
  isRealDate,
  localToUtc,
  monthGrid,
  shiftDays,
  shiftMonths,
  timeOptions,
  todayIn,
  utcOffsetLabel,
  utcToLocal,
  weekdayOf,
} from "@/features/events/time";

describe("localToUtc: the venue's wall clock to an instant", () => {
  test("Kigali, no daylight saving: 19:30 is 17:30 UTC", () => {
    assert.deepEqual(localToUtc("2026-10-17", "19:30", "Africa/Kigali"), {
      ok: true,
      iso: "2026-10-17T17:30:00.000Z",
    });
  });

  test("a time just after midnight lands on the previous UTC day", () => {
    assert.deepEqual(localToUtc("2027-01-01", "00:30", "Africa/Kigali"), {
      ok: true,
      iso: "2026-12-31T22:30:00.000Z",
    });
  });

  test("New York in winter and in summer", () => {
    assert.equal(
      localToUtc("2026-01-15", "19:00", "America/New_York").ok &&
        (
          localToUtc("2026-01-15", "19:00", "America/New_York") as {
            iso: string;
          }
        ).iso,
      "2026-01-16T00:00:00.000Z",
    );
    assert.deepEqual(localToUtc("2026-07-15", "19:00", "America/New_York"), {
      ok: true,
      iso: "2026-07-15T23:00:00.000Z",
    });
  });

  test("London spring forward: 01:30 does not exist, 02:30 is suggested", () => {
    assert.deepEqual(localToUtc("2026-03-29", "01:30", "Europe/London"), {
      ok: false,
      reason: "gap",
      suggestion: "02:30",
    });
  });

  test("New York spring forward: 02:15 does not exist, 03:15 is suggested", () => {
    assert.deepEqual(localToUtc("2026-03-08", "02:15", "America/New_York"), {
      ok: false,
      reason: "gap",
      suggestion: "03:15",
    });
  });

  test("the minutes either side of the gap are fine", () => {
    assert.equal(localToUtc("2026-03-29", "00:59", "Europe/London").ok, true);
    assert.equal(localToUtc("2026-03-29", "02:00", "Europe/London").ok, true);
  });

  test("London autumn: 01:30 happens twice, the first one (still summer time) wins", () => {
    assert.deepEqual(localToUtc("2026-10-25", "01:30", "Europe/London"), {
      ok: true,
      iso: "2026-10-25T00:30:00.000Z",
    });
  });

  test("Lord Howe moves by 30 minutes; the first occurrence still wins", () => {
    assert.deepEqual(localToUtc("2026-04-05", "01:45", "Australia/Lord_Howe"), {
      ok: true,
      iso: "2026-04-04T14:45:00.000Z",
    });
  });

  test("a leap day exists in 2028", () => {
    assert.deepEqual(localToUtc("2028-02-29", "18:00", "Africa/Kigali"), {
      ok: true,
      iso: "2028-02-29T16:00:00.000Z",
    });
  });

  test("an off-grid time is kept as typed", () => {
    assert.deepEqual(localToUtc("2026-11-10", "13:37", "Africa/Kigali"), {
      ok: true,
      iso: "2026-11-10T11:37:00.000Z",
    });
  });
});

describe("utcToLocal: back to the form", () => {
  test("round trip in Kigali", () => {
    assert.deepEqual(utcToLocal("2026-10-17T17:30:00.000Z", "Africa/Kigali"), {
      date: "2026-10-17",
      time: "19:30",
    });
  });

  test("the date is the venue's, not UTC's", () => {
    assert.deepEqual(utcToLocal("2026-12-31T22:30:00.000Z", "Africa/Kigali"), {
      date: "2027-01-01",
      time: "00:30",
    });
  });

  test("the first London 01:30 reads back as 01:30", () => {
    assert.deepEqual(utcToLocal("2026-10-25T00:30:00.000Z", "Europe/London"), {
      date: "2026-10-25",
      time: "01:30",
    });
  });

  test("every quarter hour of a DST-change day survives the round trip, except the gap", () => {
    for (const time of timeOptions(null)) {
      const result = localToUtc("2026-03-29", time, "Europe/London");
      if (time >= "01:00" && time < "02:00") {
        assert.equal(result.ok, false, time);
        continue;
      }
      assert.ok(result.ok, time);
      assert.deepEqual(utcToLocal(result.iso, "Europe/London"), {
        date: "2026-03-29",
        time,
      });
    }
  });
});

describe("calendar helpers", () => {
  test("real dates, month lengths and leap years", () => {
    assert.equal(isRealDate("2026-02-28"), true);
    assert.equal(isRealDate("2026-02-29"), false);
    assert.equal(isRealDate("2028-02-29"), true);
    assert.equal(isRealDate("2100-02-29"), false);
    assert.equal(isRealDate("2026-04-31"), false);
    assert.equal(isRealDate("2026-13-01"), false);
    assert.equal(isRealDate("2026-1-1"), false);
  });

  test("weeks start on Monday: November 2026 starts on a Sunday", () => {
    const grid = monthGrid(2026, 11);
    assert.deepEqual(grid.slice(0, 7), [
      null,
      null,
      null,
      null,
      null,
      null,
      "2026-11-01",
    ]);
    assert.equal(grid.at(-1), "2026-11-30");
  });

  test("a month starting on Monday has no blanks", () => {
    assert.equal(monthGrid(2026, 6)[0], "2026-06-01");
  });

  test("February in a leap year", () => {
    assert.equal(monthGrid(2028, 2).filter(Boolean).length, 29);
  });

  test("paging months wraps the year both ways", () => {
    assert.deepEqual(addMonths(2026, 12, 1), { year: 2027, month: 1 });
    assert.deepEqual(addMonths(2026, 1, -1), { year: 2025, month: 12 });
    assert.deepEqual(addMonths(2026, 5, 0), { year: 2026, month: 5 });
  });

  test("a plain date reads the same whatever the device's zone", () => {
    assert.equal(formatPlainDate("2026-11-10"), "Tue 10 Nov 2026");
  });

  test("today is the venue's date: 23:30 UTC is already tomorrow in Kigali", () => {
    const lateEvening = Date.parse("2026-10-01T23:30:00Z");
    assert.equal(todayIn("Africa/Kigali", lateEvening), "2026-10-02");
    assert.equal(todayIn("America/New_York", lateEvening), "2026-10-01");
  });

  test("the time menu keeps an off-grid time in order", () => {
    const options = timeOptions("13:37");
    assert.equal(options.length, 97);
    assert.equal(options[options.indexOf("13:37") - 1], "13:30");
    assert.equal(options[options.indexOf("13:37") + 1], "13:45");
    assert.equal(timeOptions("19:30").length, 96);
  });

  test("offset labels follow the season", () => {
    assert.equal(
      utcOffsetLabel("Africa/Kigali", Date.parse("2026-07-01T12:00:00Z")),
      "UTC+2",
    );
    assert.equal(
      utcOffsetLabel("Europe/London", Date.parse("2026-01-01T12:00:00Z")),
      "UTC",
    );
    assert.equal(
      utcOffsetLabel("Europe/London", Date.parse("2026-07-01T12:00:00Z")),
      "UTC+1",
    );
    assert.equal(
      utcOffsetLabel("Asia/Kolkata", Date.parse("2026-07-01T12:00:00Z")),
      "UTC+5:30",
    );
    assert.equal(
      utcOffsetLabel("America/New_York", Date.parse("2026-07-01T12:00:00Z")),
      "UTC-4",
    );
  });

  test("moving by days crosses months, years and leap days", () => {
    assert.equal(shiftDays("2026-12-31", 1), "2027-01-01");
    assert.equal(shiftDays("2028-03-01", -1), "2028-02-29");
    assert.equal(shiftDays("2026-03-29", 7), "2026-04-05");
  });

  test("moving by months keeps the day only where it exists", () => {
    assert.equal(shiftMonths("2026-01-31", 1), "2026-02-28");
    assert.equal(shiftMonths("2028-01-31", 1), "2028-02-29");
    assert.equal(shiftMonths("2026-03-31", -1), "2026-02-28");
    assert.equal(shiftMonths("2026-12-15", 1), "2027-01-15");
    assert.equal(shiftMonths("2026-05-10", -12), "2025-05-10");
  });

  test("weekdays count from Monday", () => {
    assert.equal(weekdayOf("2026-11-02"), 0);
    assert.equal(weekdayOf("2026-11-01"), 6);
  });
});

describe("formatEventDate: shown in the venue's zone", () => {
  test("this year: no year; another year: the year, same shape", async () => {
    const { formatEventDate } = await import("@/features/events/format");
    const thisYear = new Date().getUTCFullYear();
    assert.equal(
      formatEventDate(`${thisYear}-06-15T17:30:00Z`, "Africa/Kigali").replace(
        /^\w{3} /,
        "Day ",
      ),
      "Day 15 Jun, 19:30",
    );
    // London is on summer time by late April: 18:30 UTC is 19:30 there.
    assert.equal(
      formatEventDate("2031-04-28T18:30:00Z", "Europe/London"),
      "Mon 28 Apr 2031, 19:30",
    );
    assert.equal(
      formatEventDate("2031-12-31T22:30:00Z", "Africa/Kigali"),
      "Thu 1 Jan 2032, 00:30",
    );
  });
});
