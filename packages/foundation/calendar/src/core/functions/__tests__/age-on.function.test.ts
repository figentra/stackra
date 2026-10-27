/**
 * Stackra file contract:
 * Purpose: unit tests of `ageOn` as calendar's entry re-exports it from @stackra/support: whole years, both
 *          `LeapBirthday` rules, and a refusal before birth, so the enum's codes stay the ones support reads.
 * Boundary: test only; imports the subject through the `#core` entry and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366; stackra-224.
 */
import { describe, expect, it } from "@stackra/testing";

import { LeapBirthday } from "#core/enums/leap-birthday.enum";
import { ageOn } from "#core/index";

describe("ageOn", () => {
  it("counts whole years", () => {
    expect(ageOn("2010-06-15", "2026-06-14", LeapBirthday.March1)).toBe(15);
    expect(ageOn("2010-06-15", "2026-06-15", LeapBirthday.March1)).toBe(16);
    expect(ageOn("2010-06-15", "2010-06-15", LeapBirthday.March1)).toBe(0);
  });

  it("applies the leap-birthday rule in a common year", () => {
    expect(ageOn("2008-02-29", "2026-02-28", LeapBirthday.February28)).toBe(18);
    expect(ageOn("2008-02-29", "2026-02-28", LeapBirthday.March1)).toBe(17);
    expect(ageOn("2008-02-29", "2026-03-01", LeapBirthday.March1)).toBe(18);
    expect(ageOn("2008-02-29", "2028-02-29", LeapBirthday.March1)).toBe(20);
  });

  it("refuses a date before birth", () => {
    expect(() => ageOn("2010-06-15", "2010-06-14", LeapBirthday.March1)).toThrow(RangeError);
  });
});
