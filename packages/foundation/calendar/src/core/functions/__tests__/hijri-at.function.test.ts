/**
 * Stackra file contract:
 * Purpose: unit tests of `hijriAt`: the Umm al-Qura date of a day number.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { dayNumber } from "#core/functions/day-number.function";
import { hijriAt } from "#core/functions/hijri-at.function";

describe("hijriAt", () => {
  it("reads Umm al-Qura", () => {
    expect(hijriAt(dayNumber("2025-03-01"))).toEqual({ year: 1446, month: 9, day: 1 });
    expect(hijriAt(dayNumber("2026-03-20"))).toEqual({ year: 1447, month: 10, day: 1 });
  });
});
