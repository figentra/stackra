/**
 * Stackra file contract:
 * Purpose: unit tests of `parseRrule`: the supported parts, defaults, and every refusal (unknown or repeated part, missing FREQ, COUNT with UNTIL, a position outside a month).
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { parseRrule } from "#core/functions/parse-rrule.function";

describe("parseRrule", () => {
  it("reads every supported part", () => {
    expect(
      parseRrule(
        "RRULE:FREQ=YEARLY;INTERVAL=2;UNTIL=20301231T000000Z;BYDAY=2MO;BYMONTHDAY=-1;BYMONTH=1,7;WKST=SU",
      ),
    ).toEqual({
      freq: "YEARLY",
      interval: 2,
      count: undefined,
      until: "2030-12-31",
      byDay: [{ weekday: 1, nth: 2 }],
      byMonthDay: [-1],
      byMonth: [1, 7],
      weekStart: 7,
    });
  });

  it("defaults the interval and week start", () => {
    expect(parseRrule("freq=weekly;count=3")).toMatchObject({
      freq: "WEEKLY",
      interval: 1,
      count: 3,
      weekStart: 1,
    });
  });

  it.each([
    "FREQ=WEEKLY;BYSETPOS=1",
    "FREQ=WEEKLY;FREQ=DAILY",
    "INTERVAL=2",
    "FREQ=HOURLY",
    "FREQ=DAILY;COUNT=2;UNTIL=20300101",
    "FREQ=WEEKLY;BYDAY=2MO",
    "FREQ=YEARLY;BYDAY=1MO",
    "FREQ=DAILY;INTERVAL=0",
    "FREQ=DAILY;BYDAY=XX",
    "FREQ=DAILY;UNTIL=2030",
    "FREQ=MONTHLY;BYMONTHDAY=0",
  ])("refuses %s", (rule) => {
    expect(() => parseRrule(rule)).toThrow(RangeError);
  });
});
