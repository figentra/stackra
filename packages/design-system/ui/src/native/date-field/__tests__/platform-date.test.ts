/**
 * Stackra file contract:
 * Purpose: proves a day becomes local noon of that day and a platform `Date` the day it falls on in local time, so a
 *          round trip keeps the day, across a month's end, a leap day and a year below 100.
 * Boundary: pure functions; no stand-ins.
 * Runtime: node
 * Governing contract: ADR 0318 (decision 8); ADR 0022 (test placement).
 */
// @covers sta-350:FR-206
import { CalendarDate } from "@internationalized/date";

import { toPlatformDate } from "#native/date-field/platform-date";
import { toCalendarDate } from "#native/date-field/to-calendar-date.function";

describe("platform date", () => {
  it("turns a day into local noon of that day", () => {
    const date = toPlatformDate(new CalendarDate(2026, 10, 24));
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([
      2026, 9, 24, 12,
    ]);
  });

  it("reads the local day of any time, early or late", () => {
    expect(toCalendarDate(new Date(2026, 0, 31, 0, 0)).toString()).toBe("2026-01-31");
    expect(toCalendarDate(new Date(2026, 0, 31, 23, 59)).toString()).toBe("2026-01-31");
  });

  // Node reads `TZ` at each date operation, so each case runs in the zone it names; the days are daylight-saving
  // changes in those zones, where a midnight conversion would land on the day before.
  it.each([
    ["Pacific/Kiritimati", "2026-01-01"],
    ["Pacific/Pago_Pago", "2026-12-31"],
    ["America/New_York", "2026-03-08"],
    ["Europe/London", "2026-03-29"],
    ["America/Santiago", "2026-04-05"],
  ])("in %s keeps %s through a round trip", (zone, text) => {
    const saved = process.env["TZ"];
    process.env["TZ"] = zone;
    try {
      const [year, month, date] = text.split("-").map(Number) as [number, number, number];
      const platform = toPlatformDate(new CalendarDate(year, month, date));
      expect(platform.getHours()).toBe(12);
      expect(toCalendarDate(platform).toString()).toBe(text);
    } finally {
      // Assigning `undefined` would store the string "undefined", so an unset zone is deleted.
      if (saved === undefined) delete process.env["TZ"];
      else process.env["TZ"] = saved;
    }
  });

  it.each(["2024-02-29", "2026-12-31", "0042-03-01"])("keeps %s through a round trip", (text) => {
    const [year, month, day] = text.split("-").map(Number) as [number, number, number];
    expect(toCalendarDate(toPlatformDate(new CalendarDate(year, month, day))).toString()).toBe(
      text,
    );
  });
});
