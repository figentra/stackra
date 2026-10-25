/**
 * Stackra file contract:
 * Purpose: unit tests of `addWorkingMinutes`: minutes inside a day, carried over rest days and holidays, zero, and refusals.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. The
 *           calendar data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { addWorkingMinutes } from "#core/functions/add-working-minutes.function";
import type { BusinessCalendar } from "#core/types/business-calendar.type";

/** A fixture calendar: UTC+3, Sunday to Thursday 09:00-17:00. */
const calendar: BusinessCalendar = {
  timeZone: "Asia/Riyadh",
  workingWeek: [7, 1, 2, 3, 4].map((day) => ({ day, hours: [{ start: "09:00", end: "17:00" }] })),
  holidays: [
    { kind: "dated", key: "closure", date: "2026-01-05", days: 1 },
    { kind: "hijri", key: "feast", month: 10, day: 1, days: 3, sighted: true },
  ],
  uncertainDays: "working",
};

describe("addWorkingMinutes", () => {
  it("adds within one day", () => {
    expect(addWorkingMinutes(calendar, "2026-01-04T07:00:00Z", 60)).toBe(
      "2026-01-04T08:00:00.000Z",
    );
  });

  it("carries over the closed days", () => {
    // Sunday 13:00Z leaves 60 minutes; Monday is a closure, so the rest falls on Tuesday.
    expect(addWorkingMinutes(calendar, "2026-01-04T13:00:00Z", 120)).toBe(
      "2026-01-06T07:00:00.000Z",
    );
  });

  it("gives the next open instant for zero", () => {
    expect(addWorkingMinutes(calendar, "2026-01-04T20:00:00Z", 0)).toBe("2026-01-06T06:00:00.000Z");
  });

  it("refuses negative minutes and a calendar with no working time", () => {
    expect(() => addWorkingMinutes(calendar, "2026-01-04T07:00:00Z", -1)).toThrow(RangeError);
    expect(() =>
      addWorkingMinutes({ ...calendar, workingWeek: [] }, "2026-01-04T07:00:00Z", 1),
    ).toThrow(RangeError);
  });
});
