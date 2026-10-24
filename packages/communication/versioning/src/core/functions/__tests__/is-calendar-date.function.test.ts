/**
 * Stackra file contract:
 * Purpose: unit tests of `isCalendarDate`: real `YYYY-MM-DD` days pass; impossible days, other formats and non-strings
 *          do not.
 * Boundary: test only; an internal function, reached through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0118 (API versions are dates).
 */
import { describe, expect, it } from "@stackra/testing";

import { isCalendarDate } from "#core/functions/is-calendar-date.function";

describe("isCalendarDate", () => {
  it("takes real days", () => {
    expect(isCalendarDate("2027-03-01")).toBe(true);
    expect(isCalendarDate("2028-02-29")).toBe(true);
  });

  it("refuses impossible days, other formats and non-strings", () => {
    expect(isCalendarDate("2027-02-29")).toBe(false);
    expect(isCalendarDate("2027-13-01")).toBe(false);
    expect(isCalendarDate("2027-3-1")).toBe(false);
    expect(isCalendarDate("2027-03-01T00:00:00Z")).toBe(false);
    expect(isCalendarDate(20270301)).toBe(false);
    expect(isCalendarDate(undefined)).toBe(false);
  });
});
