/**
 * Stackra file contract:
 * Purpose: unit tests of `hijriOf`: Umm al-Qura dates of known Gregorian dates, including a month boundary.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { hijriOf } from "#core/functions/hijri-of.function";

describe("hijriOf", () => {
  it.each([
    ["2025-03-01", { year: 1446, month: 9, day: 1 }],
    ["2025-03-29", { year: 1446, month: 9, day: 29 }],
    ["2025-03-30", { year: 1446, month: 10, day: 1 }],
    ["2025-06-26", { year: 1447, month: 1, day: 1 }],
  ])("reads %s", (date, hijri) => {
    expect(hijriOf(date)).toEqual(hijri);
  });

  it("refuses a malformed date", () => {
    expect(() => hijriOf("2025-3-1")).toThrow(RangeError);
  });
});
