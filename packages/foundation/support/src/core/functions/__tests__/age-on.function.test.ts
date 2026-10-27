/**
 * Stackra file contract:
 * Purpose: unit tests of `ageOn`: whole years before and on a birthday, a 29 February birth under both leap-birthday
 *          rules in common and leap years, and refusals of a date before birth or not `YYYY-MM-DD`.
 * Boundary: test only; the leap rules are passed as the codes market packs carry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0366 (decision 8); stackra-224 (calendar's rule).
 */
import { describe, expect, it } from "@stackra/testing";

import { ageOn } from "#core/functions/age-on.function";

describe("ageOn", () => {
  it("counts whole years", () => {
    expect(ageOn("2010-06-15", "2026-06-14", "march_1")).toBe(15);
    expect(ageOn("2010-06-15", "2026-06-15", "march_1")).toBe(16);
    expect(ageOn("2010-06-15", "2010-06-15", "march_1")).toBe(0);
    expect(ageOn("2010-10-26", "2026-10-25", "march_1")).toBe(15);
  });

  it("applies the leap-birthday rule to a 29 February birth in a common year", () => {
    expect(ageOn("2008-02-29", "2026-02-27", "february_28")).toBe(17);
    expect(ageOn("2008-02-29", "2026-02-28", "february_28")).toBe(18);
    expect(ageOn("2008-02-29", "2026-02-28", "march_1")).toBe(17);
    expect(ageOn("2008-02-29", "2026-03-01", "march_1")).toBe(18);
  });

  it("counts a 29 February birth on 29 February in a leap year, whatever the rule", () => {
    expect(ageOn("2008-02-29", "2028-02-28", "february_28")).toBe(19);
    expect(ageOn("2008-02-29", "2028-02-29", "february_28")).toBe(20);
    expect(ageOn("2008-02-29", "2028-02-29", "march_1")).toBe(20);
    expect(ageOn("2000-02-29", "2100-02-28", "february_28")).toBe(100);
    expect(ageOn("2000-02-29", "2100-02-28", "march_1")).toBe(99);
  });

  it("refuses a date before birth and a date that is not YYYY-MM-DD", () => {
    expect(() => ageOn("2010-06-15", "2010-06-14", "march_1")).toThrow(RangeError);
    expect(() => ageOn("15/06/2010", "2026-06-15", "march_1")).toThrow(RangeError);
    expect(() => ageOn("2010-06-15", "2026-6-15", "march_1")).toThrow(RangeError);
  });
});
