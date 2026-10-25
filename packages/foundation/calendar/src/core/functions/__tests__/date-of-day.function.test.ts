/**
 * Stackra file contract:
 * Purpose: unit tests of `dateOfDay`: the inverse of `dayNumber`.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { dateOfDay } from "#core/functions/date-of-day.function";
import { dayNumber } from "#core/functions/day-number.function";

describe("dateOfDay", () => {
  it("returns the date of a day number", () => {
    expect(dateOfDay(0)).toBe("1970-01-01");
    expect(dateOfDay(-1)).toBe("1969-12-31");
    expect(dateOfDay(dayNumber("2028-02-29"))).toBe("2028-02-29");
  });
});
