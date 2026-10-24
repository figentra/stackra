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

import { toCalendarDate, toPlatformDate } from "#native/date-field/platform-date";

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

  it.each(["2024-02-29", "2026-12-31", "0042-03-01"])("keeps %s through a round trip", (text) => {
    const [year, month, day] = text.split("-").map(Number) as [number, number, number];
    expect(toCalendarDate(toPlatformDate(new CalendarDate(year, month, day))).toString()).toBe(
      text,
    );
  });
});
