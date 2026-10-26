/**
 * Stackra file contract:
 * Purpose: unit tests of `holidayCover`: dated spans, yearly spans crossing a year end, missing yearly dates, weekday
 *          positions with an offset, observed shifts (into the year before too), sighted rules and dated overrides.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366; ADR 0387.
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

  it("covers the n-th and the last weekday of a month, with an offset", () => {
    const fourthThursday: HolidayRule = {
      kind: "nth_weekday",
      key: "harvest",
      month: 11,
      weekday: 4,
      nth: 4,
      offset: 0,
      days: 1,
    };
    expect(holidayCover(fourthThursday, dayNumber("2026-11-26"), [fourthThursday])).toBe(
      DayStatus.Holiday,
    );
    const dayAfter: HolidayRule = { ...fourthThursday, key: "after", offset: 1 };
    expect(holidayCover(dayAfter, dayNumber("2026-11-27"), [dayAfter])).toBe(DayStatus.Holiday);
    const lastMonday: HolidayRule = {
      ...fourthThursday,
      key: "spring",
      month: 5,
      weekday: 1,
      nth: -1,
    };
    expect(holidayCover(lastMonday, dayNumber("2026-05-25"), [lastMonday])).toBe(DayStatus.Holiday);
    const fifthMonday: HolidayRule = { ...lastMonday, key: "rare", nth: 5 };
    expect(holidayCover(fifthMonday, dayNumber("2026-05-25"), [fifthMonday])).toBeUndefined();
  });

  it("moves a date off a weekend by its observed shift", () => {
    const observe = [
      { weekday: 6, shift: -1 },
      { weekday: 7, shift: 1 },
    ];
    const founding: HolidayRule = {
      kind: "gregorian",
      key: "founding",
      month: 7,
      day: 4,
      days: 1,
      observe,
    };
    // 4 July 2026 is a Saturday: kept on Friday the 3rd.
    expect(holidayCover(founding, dayNumber("2026-07-03"), [founding])).toBe(DayStatus.Holiday);
    expect(holidayCover(founding, dayNumber("2026-07-04"), [founding])).toBeUndefined();
    const first: HolidayRule = {
      kind: "gregorian",
      key: "first",
      month: 1,
      day: 1,
      days: 1,
      observe,
    };
    // 1 January 2028 is a Saturday: kept on 31 December 2027.
    expect(holidayCover(first, dayNumber("2027-12-31"), [first])).toBe(DayStatus.Holiday);
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
