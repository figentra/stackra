/**
 * Stackra file contract:
 * Purpose: unit tests of `gregorianOf`: the inverse of `hijriOf` over known dates and a year of days, and a refusal for a day the month lacks.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { gregorianOf } from "#core/functions/gregorian-of.function";
import { hijriOf } from "#core/functions/hijri-of.function";

describe("gregorianOf", () => {
  it.each([
    [{ year: 1446, month: 9, day: 1 }, "2025-03-01"],
    [{ year: 1446, month: 10, day: 1 }, "2025-03-30"],
    [{ year: 1447, month: 1, day: 1 }, "2025-06-26"],
  ])("reads %j", (hijri, date) => {
    expect(gregorianOf(hijri)).toBe(date);
  });

  it("round-trips every day of a year", () => {
    for (let day = 0; day < 400; day += 1) {
      const date = new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10);
      expect(gregorianOf(hijriOf(date))).toBe(date);
    }
  });

  it("refuses a day the month does not have and an impossible date", () => {
    // Ramadan 1446 has 29 days.
    expect(() => gregorianOf({ year: 1446, month: 9, day: 30 })).toThrow(RangeError);
    expect(() => gregorianOf({ year: 1446, month: 13, day: 1 })).toThrow(RangeError);
  });
});
