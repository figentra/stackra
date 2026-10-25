/**
 * Stackra file contract:
 * Purpose: unit tests of `dayStatus`: working days, rest days, dated holidays, uncertain sighted Hijri holidays, confirmation by a dated rule with the same key, yearly Gregorian rules with `since`.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. The
 *           calendar data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { DayStatus } from "#core/enums/day-status.enum";
import { dayStatus } from "#core/functions/day-status.function";
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

describe("dayStatus", () => {
  it("reads the working week", () => {
    expect(dayStatus(calendar, "2026-01-04")).toBe(DayStatus.Working);
    expect(dayStatus(calendar, "2026-01-09")).toBe(DayStatus.RestDay);
  });

  it("marks a dated holiday", () => {
    expect(dayStatus(calendar, "2026-01-05")).toBe(DayStatus.Holiday);
  });

  it("marks a sighted Hijri holiday uncertain on a working day and leaves rest days closed", () => {
    // 1 Shawwal 1447 is 2026-03-20 (Friday); the span runs to Sunday 2026-03-22.
    expect(dayStatus(calendar, "2026-03-20")).toBe(DayStatus.RestDay);
    expect(dayStatus(calendar, "2026-03-22")).toBe(DayStatus.Uncertain);
    expect(dayStatus(calendar, "2026-03-23")).toBe(DayStatus.Working);
  });

  it("lets a dated rule with the same key confirm or move the Hijri occurrence", () => {
    const confirmed: BusinessCalendar = {
      ...calendar,
      holidays: [
        ...calendar.holidays,
        { kind: "dated", key: "feast", date: "2026-03-19", days: 2 },
      ],
    };
    expect(dayStatus(confirmed, "2026-03-19")).toBe(DayStatus.Holiday);
    expect(dayStatus(confirmed, "2026-03-22")).toBe(DayStatus.Working);
  });

  it("marks an unsighted Hijri holiday as a holiday", () => {
    const fixed: BusinessCalendar = {
      ...calendar,
      holidays: [{ kind: "hijri", key: "feast", month: 10, day: 1, days: 3, sighted: false }],
    };
    expect(dayStatus(fixed, "2026-03-22")).toBe(DayStatus.Holiday);
  });

  it("applies a yearly Gregorian rule only within since and until", () => {
    const yearly: BusinessCalendar = {
      ...calendar,
      holidays: [
        { kind: "gregorian", key: "day", month: 2, day: 22, days: 1, since: "2026-01-01" },
      ],
    };
    expect(dayStatus(yearly, "2026-02-22")).toBe(DayStatus.Holiday);
    expect(dayStatus(yearly, "2027-02-22")).toBe(DayStatus.Holiday);
    expect(dayStatus(yearly, "2024-02-22")).toBe(DayStatus.Working);
  });

  it("refuses a malformed date", () => {
    expect(() => dayStatus(calendar, "2026-02-30")).toThrow(RangeError);
  });
});
