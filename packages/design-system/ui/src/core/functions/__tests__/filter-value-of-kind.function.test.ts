/**
 * Stackra file contract:
 * Purpose: proves `filterValueOfKind` returns a value that has the shape of its kind, and `undefined` for a missing
 *          value and for each wrong shape (text for a number filter, a number range for a text filter, and so on).
 * Boundary: pure unit test.
 * Runtime: node
 * Governing contract: ADR 0318; ADR 0022 (test placement).
 */
// @covers sta-350:FR-196
import { CalendarDate } from "@internationalized/date";

import { filterValueOfKind } from "#core/functions/filter-value-of-kind.function";

describe("filterValueOfKind", () => {
  it("returns a value of the right shape for each kind", () => {
    const day = new CalendarDate(2026, 10, 24);
    expect(filterValueOfKind("text", "ada")).toBe("ada");
    expect(filterValueOfKind("select", "paid")).toBe("paid");
    expect(filterValueOfKind("boolean", false)).toBe(false);
    expect(filterValueOfKind("multi-select", ["a", "b"])).toEqual(["a", "b"]);
    expect(filterValueOfKind("number", { min: 1, max: null })).toEqual({ min: 1, max: null });
    expect(filterValueOfKind("date-range", { start: day, end: null })).toEqual({
      start: day,
      end: null,
    });
  });

  it("returns undefined for a filter that is not set", () => {
    expect(filterValueOfKind("text", undefined)).toBeUndefined();
    expect(filterValueOfKind("boolean", undefined)).toBeUndefined();
  });

  it("returns undefined for a value of another kind's shape", () => {
    expect(filterValueOfKind("number", "12")).toBeUndefined();
    expect(filterValueOfKind("text", { min: 1, max: 2 })).toBeUndefined();
    expect(filterValueOfKind("boolean", "true")).toBeUndefined();
    expect(filterValueOfKind("multi-select", "paid")).toBeUndefined();
    expect(filterValueOfKind("date-range", { min: 1, max: 2 })).toBeUndefined();
    expect(filterValueOfKind("select", ["paid"])).toBeUndefined();
  });
});
