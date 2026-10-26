/**
 * Stackra file contract:
 * Purpose: unit tests of `parseRrule`: every supported part (BYYEARDAY, BYWEEKNO, BYHOUR, BYMINUTE, BYSECOND, BYSETPOS
 *          and UNTIL with a time included), defaults, every combination RFC 5545 forbids, and the parts refused on
 *          purpose with their reason in the message.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366; ADR 0387.
 */
import { describe, expect, it } from "@stackra/testing";

import { parseRrule } from "#core/functions/parse-rrule.function";

describe("parseRrule", () => {
  it("reads the date parts", () => {
    expect(
      parseRrule(
        "RRULE:FREQ=YEARLY;INTERVAL=2;UNTIL=20301231;BYDAY=2MO;BYMONTHDAY=-1;BYMONTH=1,7;WKST=SU",
      ),
    ).toEqual({
      freq: "YEARLY",
      interval: 2,
      count: undefined,
      until: "2030-12-31",
      untilTime: undefined,
      byDay: [{ weekday: 1, nth: 2 }],
      byMonthDay: [-1],
      byMonth: [1, 7],
      byYearDay: [],
      byWeekNo: [],
      byHour: [],
      byMinute: [],
      bySecond: [],
      bySetPos: [],
      weekStart: 7,
    });
  });

  it("reads the year, week, time and set-position parts", () => {
    expect(
      parseRrule("FREQ=YEARLY;BYYEARDAY=1,-1;BYWEEKNO=20,-1;BYHOUR=0,9;BYMINUTE=30;BYSECOND=15"),
    ).toMatchObject({
      byYearDay: [1, -1],
      byWeekNo: [20, -1],
      byHour: [0, 9],
      byMinute: [30],
      bySecond: [15],
    });
    expect(parseRrule("FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1").bySetPos).toEqual([-1]);
  });

  it("reads a BYDAY position in the year for YEARLY without BYMONTH", () => {
    expect(parseRrule("FREQ=YEARLY;BYDAY=20MO,-1FR").byDay).toEqual([
      { weekday: 1, nth: 20 },
      { weekday: 5, nth: -1 },
    ]);
  });

  it("reads UNTIL with a UTC or a wall time", () => {
    expect(parseRrule("FREQ=DAILY;UNTIL=20301231T153000Z")).toMatchObject({
      until: "2030-12-31",
      untilTime: { second: 55_800, utc: true },
    });
    expect(parseRrule("FREQ=DAILY;UNTIL=20301231T090005").untilTime).toEqual({
      second: 32_405,
      utc: false,
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
    "FREQ=WEEKLY;BYDAY=MO;BYSETPOS=0",
    "FREQ=WEEKLY;FREQ=DAILY",
    "INTERVAL=2",
    "FREQ=DAILY;COUNT=2;UNTIL=20300101",
    "FREQ=WEEKLY;BYDAY=2MO",
    "FREQ=YEARLY;BYMONTH=1;BYDAY=6MO",
    "FREQ=YEARLY;BYWEEKNO=1;BYDAY=1MO",
    "FREQ=MONTHLY;BYYEARDAY=1",
    "FREQ=MONTHLY;BYWEEKNO=1",
    "FREQ=WEEKLY;BYMONTHDAY=1",
    "FREQ=YEARLY;BYYEARDAY=367",
    "FREQ=YEARLY;BYWEEKNO=54",
    "FREQ=DAILY;BYHOUR=24",
    "FREQ=DAILY;BYMINUTE=60",
    "FREQ=DAILY;INTERVAL=0",
    "FREQ=DAILY;BYDAY=XX",
    "FREQ=DAILY;UNTIL=2030",
    "FREQ=DAILY;UNTIL=20301231T250000Z",
    "FREQ=MONTHLY;BYMONTHDAY=0",
    "FREQ=DAILY;X-NAME=1",
  ])("refuses %s", (rule) => {
    expect(() => parseRrule(rule)).toThrow(RangeError);
  });

  it.each([
    ["FREQ=HOURLY", /FREQ=HOURLY refused: .*openIntervals/],
    ["FREQ=MINUTELY", /FREQ=MINUTELY refused/],
    ["FREQ=SECONDLY", /FREQ=SECONDLY refused/],
    ["FREQ=YEARLY;RSCALE=ISLAMIC-UMALQURA", /RSCALE refused: .*hijri/],
    ["FREQ=YEARLY;SKIP=FORWARD", /SKIP refused/],
    ["FREQ=DAILY;BYSECOND=60", /BYSECOND=60 refused: a leap second/],
  ])("refuses %s on purpose with its reason", (rule, reason) => {
    expect(() => parseRrule(rule)).toThrow(reason);
  });
});
