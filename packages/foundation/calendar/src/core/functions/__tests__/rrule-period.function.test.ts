/**
 * Stackra file contract:
 * Purpose: unit tests of `rrulePeriod`: the n-th day, week from WKST, month and year holding the start, stepped by
 *          INTERVAL.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0387.
 */
import { describe, expect, it } from "@stackra/testing";

import { dayNumber } from "#core/functions/day-number.function";
import { parseRrule } from "#core/functions/parse-rrule.function";
import { rrulePeriod } from "#core/functions/rrule-period.function";

const start = dayNumber("2026-01-04"); // a Sunday

/** Period `index` of `rule` as dates. */
const period = (rule: string, index: number): [number, number] => {
  const [first, last] = rrulePeriod(parseRrule(rule), start, index);
  return [first, last];
};

describe("rrulePeriod", () => {
  it("steps days and weeks", () => {
    expect(period("FREQ=DAILY;INTERVAL=2", 3)).toEqual([start + 6, start + 6]);
    expect(period("FREQ=WEEKLY", 0)).toEqual([dayNumber("2025-12-29"), dayNumber("2026-01-04")]);
    expect(period("FREQ=WEEKLY;WKST=SU", 1)).toEqual([
      dayNumber("2026-01-11"),
      dayNumber("2026-01-17"),
    ]);
  });

  it("steps months and years", () => {
    expect(period("FREQ=MONTHLY", 1)).toEqual([dayNumber("2026-02-01"), dayNumber("2026-02-28")]);
    expect(period("FREQ=MONTHLY;INTERVAL=12", 1)).toEqual([
      dayNumber("2027-01-01"),
      dayNumber("2027-01-31"),
    ]);
    expect(period("FREQ=YEARLY", 2)).toEqual([dayNumber("2028-01-01"), dayNumber("2028-12-31")]);
  });
});
