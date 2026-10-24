/**
 * Stackra file contract:
 * Purpose: proves `isFilterValueEmpty` calls blank text, an empty list, a number range with no bound and a date range
 *          with no day empty, calls a set value of each kind not empty, and never calls a yes or no empty, whichever
 *          answer it holds.
 * Boundary: pure unit test.
 * Runtime: node
 * Governing contract: ADR 0318; ADR 0022 (test placement).
 */
// @covers sta-350:FR-187
import { CalendarDate } from "@internationalized/date";

import { isFilterValueEmpty } from "#core/functions/is-filter-value-empty.function";

describe("isFilterValueEmpty", () => {
  it("calls empty and blank text empty and any other text set", () => {
    expect(isFilterValueEmpty("")).toBe(true);
    expect(isFilterValueEmpty("   ")).toBe(true);
    expect(isFilterValueEmpty("paid")).toBe(false);
  });

  it("calls a list with no choice empty", () => {
    expect(isFilterValueEmpty([])).toBe(true);
    expect(isFilterValueEmpty(["paid"])).toBe(false);
  });

  it("calls a number range empty only when neither bound is set, and zero is a bound", () => {
    expect(isFilterValueEmpty({ min: null, max: null })).toBe(true);
    expect(isFilterValueEmpty({ min: 0, max: null })).toBe(false);
    expect(isFilterValueEmpty({ min: null, max: 99 })).toBe(false);
  });

  it("calls a date range empty only when neither day is set", () => {
    const day = new CalendarDate(2026, 10, 24);
    expect(isFilterValueEmpty({ start: null, end: null })).toBe(true);
    expect(isFilterValueEmpty({ start: day, end: null })).toBe(false);
    expect(isFilterValueEmpty({ start: null, end: day })).toBe(false);
  });

  it("never calls a yes or no empty, because no is an answer", () => {
    expect(isFilterValueEmpty(true)).toBe(false);
    expect(isFilterValueEmpty(false)).toBe(false);
  });
});
