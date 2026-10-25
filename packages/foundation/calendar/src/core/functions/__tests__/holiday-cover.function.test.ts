/**
 * Stackra file contract:
 * Purpose: unit tests of `holidayCover`: dated spans, yearly spans crossing a year end, missing yearly dates, sighted rules and dated overrides.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { DayStatus } from "#core/enums/day-status.enum";
import { dayNumber } from "#core/functions/day-number.function";
import { holidayCover } from "#core/functions/holiday-cover.function";
import type { HolidayRule } from "#core/types/holiday-rule.type";

describe("holidayCover", () => {
  it("covers a dated span", () => {
    const rule: HolidayRule = { kind: "dated", key: "closure", date: "2026-01-04", days: 2 };
    expect(holidayCover(rule, dayNumber("2026-01-05"), [rule])).toBe(DayStatus.Holiday);
    expect(holidayCover(rule, dayNumber("2026-01-06"), [rule])).toBeUndefined();
  });

  it("covers a yearly span that crosses the year end", () => {
    const rule: HolidayRule = { kind: "gregorian", key: "break", month: 12, day: 31, days: 2 };
    expect(holidayCover(rule, dayNumber("2027-01-01"), [rule])).toBe(DayStatus.Holiday);
  });

  it("skips a year without the date", () => {
    const rule: HolidayRule = { kind: "gregorian", key: "leap", month: 2, day: 29, days: 1 };
    expect(holidayCover(rule, dayNumber("2026-03-01"), [rule])).toBeUndefined();
    expect(holidayCover(rule, dayNumber("2028-02-29"), [rule])).toBe(DayStatus.Holiday);
  });

  it("marks a sighted rule uncertain until a dated rule replaces it", () => {
    const rule: HolidayRule = {
      kind: "hijri",
      key: "feast",
      month: 10,
      day: 1,
      days: 1,
      sighted: true,
    };
    const day = dayNumber("2026-03-20");
    expect(holidayCover(rule, day, [rule])).toBe(DayStatus.Uncertain);
    const confirmed: HolidayRule = { kind: "dated", key: "feast", date: "2026-03-21", days: 1 };
    expect(holidayCover(rule, day, [rule, confirmed])).toBeUndefined();
  });
});
