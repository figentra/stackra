/**
 * Stackra file contract:
 * Purpose: unit tests of `dayNumber`: day numbers of valid dates and refusals of malformed and rolled-over ones.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { dayNumber } from "#core/functions/day-number.function";

describe("dayNumber", () => {
  it("counts days from 1970-01-01", () => {
    expect(dayNumber("1970-01-01")).toBe(0);
    expect(dayNumber("1969-12-31")).toBe(-1);
    expect(dayNumber("2025-03-01")).toBe(20_148);
  });

  it.each(["2026-02-30", "2026-1-01", "2026-01-01T00:00:00Z", ""])("refuses %j", (date) => {
    expect(() => dayNumber(date)).toThrow(RangeError);
  });
});
