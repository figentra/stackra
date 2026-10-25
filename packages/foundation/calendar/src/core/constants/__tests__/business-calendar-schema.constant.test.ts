/**
 * Stackra file contract:
 * Purpose: unit tests of `BUSINESS_CALENDAR_SCHEMA`: it accepts well-formed calendar data with defaults, and refuses an unknown zone, a repeated weekday, empty hours, a bad time, a bad holiday kind and an unknown uncertain-day policy.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { BUSINESS_CALENDAR_SCHEMA } from "#core/constants/business-calendar-schema.constant";

const valid = {
  timeZone: "Asia/Riyadh",
  workingWeek: [{ day: 7, hours: [{ start: "09:00", end: "17:00" }] }],
  holidays: [
    { kind: "dated", key: "closure", date: "2026-01-05" },
    { kind: "gregorian", key: "day", month: 2, day: 22, since: "2026-01-01" },
    { kind: "hijri", key: "feast", month: 10, day: 1, days: 3, sighted: true },
  ],
  uncertainDays: "working",
};

describe("BUSINESS_CALENDAR_SCHEMA", () => {
  it("accepts calendar data and defaults days to 1", () => {
    const parsed = BUSINESS_CALENDAR_SCHEMA.parse(valid);
    expect(parsed.holidays.map((rule) => rule.days)).toEqual([1, 1, 3]);
  });

  it.each([
    ["an unknown zone", { timeZone: "Mars/Olympus" }],
    ["a repeated weekday", { workingWeek: [valid.workingWeek[0], valid.workingWeek[0]] }],
    ["empty hours", { workingWeek: [{ day: 1, hours: [] }] }],
    ["a bad time", { workingWeek: [{ day: 1, hours: [{ start: "9:00", end: "17:00" }] }] }],
    ["a bad weekday", { workingWeek: [{ day: 8, hours: [{ start: "09:00", end: "17:00" }] }] }],
    ["an unknown holiday kind", { holidays: [{ kind: "lunar", key: "x", month: 1, day: 1 }] }],
    ["a Hijri rule without sighted", { holidays: [{ kind: "hijri", key: "x", month: 1, day: 1 }] }],
    ["an unknown uncertain-day policy", { uncertainDays: "guess" }],
  ])("refuses %s", (_name, change) => {
    expect(BUSINESS_CALENDAR_SCHEMA.safeParse({ ...valid, ...change }).success).toBe(false);
  });
});
