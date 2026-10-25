/**
 * Stackra file contract:
 * Purpose: unit tests of `addBusinessDays`: forward and backward counts over rest days and holidays, zero, and the uncertain days reported and counted as the calendar says.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. The
 *           calendar data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { addBusinessDays } from "#core/functions/add-business-days.function";
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

describe("addBusinessDays", () => {
  it("skips rest days and holidays", () => {
    expect(addBusinessDays(calendar, "2026-01-08", 1)).toEqual({
      date: "2026-01-11",
      uncertain: [],
    });
    expect(addBusinessDays(calendar, "2026-01-04", 1)).toEqual({
      date: "2026-01-06",
      uncertain: [],
    });
  });

  it("counts backward", () => {
    expect(addBusinessDays(calendar, "2026-01-11", -1)).toEqual({
      date: "2026-01-08",
      uncertain: [],
    });
  });

  it("returns the date unchanged for zero", () => {
    expect(addBusinessDays(calendar, "2026-01-09", 0)).toEqual({
      date: "2026-01-09",
      uncertain: [],
    });
  });

  it("reports an uncertain day and counts it as the calendar says", () => {
    expect(addBusinessDays(calendar, "2026-03-19", 1)).toEqual({
      date: "2026-03-22",
      uncertain: ["2026-03-22"],
    });
    expect(addBusinessDays({ ...calendar, uncertainDays: "closed" }, "2026-03-19", 1)).toEqual({
      date: "2026-03-23",
      uncertain: ["2026-03-22"],
    });
  });

  it("refuses a fractional count", () => {
    expect(() => addBusinessDays(calendar, "2026-01-04", 1.5)).toThrow(RangeError);
  });
});
