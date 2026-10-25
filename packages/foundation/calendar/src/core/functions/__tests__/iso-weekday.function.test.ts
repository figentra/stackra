/**
 * Stackra file contract:
 * Purpose: unit tests of `isoWeekday`: Monday 1 to Sunday 7, before and after the epoch.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { dayNumber } from "#core/functions/day-number.function";
import { isoWeekday } from "#core/functions/iso-weekday.function";

describe("isoWeekday", () => {
  it("numbers the weekdays", () => {
    expect(isoWeekday(0)).toBe(4);
    expect(isoWeekday(-1)).toBe(3);
    expect(isoWeekday(dayNumber("2026-01-04"))).toBe(7);
    expect(isoWeekday(dayNumber("2026-01-05"))).toBe(1);
  });
});
