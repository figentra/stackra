/**
 * Stackra file contract:
 * Purpose: unit tests of `openIntervals`: working hours in UTC, holidays and rest days closed, night hours past midnight, clipping, and refused input.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. The
 *           calendar data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { openIntervals } from "#core/functions/open-intervals.function";
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

describe("openIntervals", () => {
  it("returns the hours of working days in UTC", () => {
    expect(openIntervals(calendar, "2026-01-03T00:00:00Z", "2026-01-07T00:00:00Z")).toEqual([
      { start: "2026-01-04T06:00:00.000Z", end: "2026-01-04T14:00:00.000Z" },
      { start: "2026-01-06T06:00:00.000Z", end: "2026-01-06T14:00:00.000Z" },
    ]);
  });

  it("clips to the window", () => {
    expect(openIntervals(calendar, "2026-01-04T10:00:00Z", "2026-01-04T11:00:00Z")).toEqual([
      { start: "2026-01-04T10:00:00.000Z", end: "2026-01-04T11:00:00.000Z" },
    ]);
  });

  it("carries night hours into the next day", () => {
    const night: BusinessCalendar = {
      ...calendar,
      holidays: [],
      workingWeek: [{ day: 7, hours: [{ start: "20:00", end: "02:00" }] }],
    };
    expect(openIntervals(night, "2026-01-04T00:00:00Z", "2026-01-06T00:00:00Z")).toEqual([
      { start: "2026-01-04T17:00:00.000Z", end: "2026-01-04T23:00:00.000Z" },
    ]);
  });

  it("follows a clock change", () => {
    const berlin: BusinessCalendar = { ...calendar, timeZone: "Europe/Berlin", holidays: [] };
    const [before, after] = [
      openIntervals(berlin, "2026-10-22T00:00:00Z", "2026-10-23T00:00:00Z"),
      openIntervals(berlin, "2026-10-26T00:00:00Z", "2026-10-27T00:00:00Z"),
    ];
    expect(before[0]?.start).toBe("2026-10-22T07:00:00.000Z");
    expect(after[0]?.start).toBe("2026-10-26T08:00:00.000Z");
  });

  it("refuses an end before the start and a local time", () => {
    expect(() => openIntervals(calendar, "2026-01-05T00:00:00Z", "2026-01-04T00:00:00Z")).toThrow(
      RangeError,
    );
    expect(() => openIntervals(calendar, "2026-01-04T00:00:00", "2026-01-05T00:00:00Z")).toThrow(
      RangeError,
    );
  });
});
