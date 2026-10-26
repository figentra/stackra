/**
 * Stackra file contract:
 * Purpose: unit tests of `rruleMatches`: intervals per frequency, the defaults taken from the start, BYMONTHDAY from
 *          the end, weekday positions in the month and in the year, BYYEARDAY and BYWEEKNO.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366; ADR 0387.
 */
import { describe, expect, it } from "@stackra/testing";

import { dayNumber } from "#core/functions/day-number.function";
import { parseRrule } from "#core/functions/parse-rrule.function";
import { rruleMatches } from "#core/functions/rrule-matches.function";

const start = dayNumber("2026-01-04"); // a Sunday

const matches = (rule: string, date: string): boolean =>
  rruleMatches(parseRrule(rule), start, dayNumber(date));

describe("rruleMatches", () => {
  it("applies the interval", () => {
    expect(matches("FREQ=WEEKLY;INTERVAL=2", "2026-01-18")).toBe(true);
    expect(matches("FREQ=WEEKLY;INTERVAL=2", "2026-01-11")).toBe(false);
    expect(matches("FREQ=DAILY;INTERVAL=3", "2026-01-07")).toBe(true);
  });

  it("takes the defaults from the start", () => {
    expect(matches("FREQ=MONTHLY", "2026-02-04")).toBe(true);
    expect(matches("FREQ=MONTHLY", "2026-02-05")).toBe(false);
    expect(matches("FREQ=YEARLY", "2027-01-04")).toBe(true);
    expect(matches("FREQ=YEARLY;BYMONTH=6", "2026-06-04")).toBe(true);
  });

  it("reads BYDAY, BYMONTHDAY and positions", () => {
    expect(matches("FREQ=WEEKLY;BYDAY=MO,WE", "2026-01-07")).toBe(true);
    expect(matches("FREQ=MONTHLY;BYMONTHDAY=-1", "2026-01-31")).toBe(true);
    expect(matches("FREQ=MONTHLY;BYDAY=2MO", "2026-01-12")).toBe(true);
    expect(matches("FREQ=MONTHLY;BYDAY=2MO", "2026-01-05")).toBe(false);
  });

  it("counts a YEARLY BYDAY position in the year", () => {
    expect(matches("FREQ=YEARLY;BYDAY=2MO", "2026-01-12")).toBe(true);
    expect(matches("FREQ=YEARLY;BYDAY=-1MO", "2026-12-28")).toBe(true);
    expect(matches("FREQ=YEARLY;BYDAY=-1MO", "2026-12-21")).toBe(false);
  });

  it("reads BYYEARDAY and BYWEEKNO", () => {
    expect(matches("FREQ=YEARLY;BYYEARDAY=-1", "2026-12-31")).toBe(true);
    expect(matches("FREQ=YEARLY;BYYEARDAY=60", "2028-02-29")).toBe(true);
    expect(matches("FREQ=YEARLY;BYWEEKNO=2;BYDAY=MO", "2026-01-05")).toBe(true);
    expect(matches("FREQ=YEARLY;BYWEEKNO=-1;BYDAY=MO", "2026-12-28")).toBe(true);
    expect(matches("FREQ=YEARLY;BYWEEKNO=2;BYDAY=MO", "2026-01-12")).toBe(false);
  });
});
