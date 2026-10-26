/**
 * Stackra file contract:
 * Purpose: unit tests of `weekNumber`: week 1 holds four days of the year, days near New Year belong to the
 *          neighbouring week-year, the count of weeks per week-year, and another week start.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0387.
 */
import { describe, expect, it } from "@stackra/testing";

import { dayNumber } from "#core/functions/day-number.function";
import { weekNumber } from "#core/functions/week-number.function";

describe("weekNumber", () => {
  it("numbers ISO weeks from Monday", () => {
    expect(weekNumber(dayNumber("2026-01-01"), 1)).toEqual({ week: 1, weeks: 53 });
    expect(weekNumber(dayNumber("2025-12-29"), 1)).toEqual({ week: 1, weeks: 53 });
    expect(weekNumber(dayNumber("2027-01-01"), 1)).toEqual({ week: 53, weeks: 53 });
    expect(weekNumber(dayNumber("2027-01-04"), 1)).toEqual({ week: 1, weeks: 52 });
  });

  it("moves the weeks with another week start", () => {
    // 4 January 2026 is a Sunday: with Sunday weeks it opens week 1.
    expect(weekNumber(dayNumber("2026-01-04"), 7).week).toBe(1);
    expect(weekNumber(dayNumber("2026-01-03"), 7).week).toBe(53);
  });
});
