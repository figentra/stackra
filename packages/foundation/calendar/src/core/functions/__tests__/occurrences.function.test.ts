/**
 * Stackra file contract:
 * Purpose: unit tests of `occurrences`: weekly and monthly series in a time zone, COUNT and UNTIL (with a UTC or wall
 *          time), the window, excepted dates, skipped holidays and flagged uncertain dates, BYSETPOS, times of day from
 *          BYHOUR, BYYEARDAY and BYWEEKNO, and the COUNT mode that counts only kept dates.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. The
 *           calendar data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366; ADR 0387.
 */
import { describe, expect, it } from "@stackra/testing";

import { CountMode } from "#core/enums/count-mode.enum";
import { occurrences } from "#core/functions/occurrences.function";
import type { BusinessCalendar } from "#core/types/business-calendar.type";

/** A fixture calendar: UTC+3, Sunday to Thursday 09:00-17:00. */
const calendar: BusinessCalendar = {
  timeZone: "Asia/Riyadh",
  workingWeek: [7, 1, 2, 3, 4].map((day) => ({ day, hours: [{ start: "09:00", end: "17:00" }] })),
  holidays: [
    { kind: "dated", key: "closure", date: "2026-01-05", days: 1 },
    { kind: "hijri", key: "feast", month: 10, day: 1, days: 3, sighted: true },
  ],
  uncertainDays: "working",
};

describe("occurrences", () => {
  const base = { start: "2026-01-04", time: "10:00", timeZone: "Asia/Riyadh", to: "2026-12-31" };

  it("expands a weekly rule with COUNT in the time zone", () => {
    expect(occurrences({ ...base, rule: "RRULE:FREQ=WEEKLY;COUNT=3" })).toEqual([
      { date: "2026-01-04", start: "2026-01-04T07:00:00.000Z", uncertain: false },
      { date: "2026-01-11", start: "2026-01-11T07:00:00.000Z", uncertain: false },
      { date: "2026-01-18", start: "2026-01-18T07:00:00.000Z", uncertain: false },
    ]);
  });

  it("counts excepted and windowed-out dates toward COUNT", () => {
    const dates = occurrences({
      ...base,
      rule: "FREQ=DAILY;COUNT=4",
      from: "2026-01-05",
      except: ["2026-01-06"],
    }).map((item) => item.date);
    expect(dates).toEqual(["2026-01-05", "2026-01-07"]);
  });

  it("skips holidays and flags uncertain dates", () => {
    const series = occurrences({
      ...base,
      rule: "FREQ=DAILY;UNTIL=20260106",
      calendar,
    });
    expect(series.map((item) => item.date)).toEqual(["2026-01-04", "2026-01-06"]);
    const feast = occurrences({
      ...base,
      start: "2026-03-22",
      rule: "FREQ=WEEKLY;COUNT=1",
      calendar,
    });
    expect(feast).toEqual([
      { date: "2026-03-22", start: "2026-03-22T07:00:00.000Z", uncertain: true },
    ]);
  });

  it("keeps the local time across a clock change", () => {
    const series = occurrences({
      rule: "FREQ=WEEKLY;COUNT=2",
      start: "2026-10-18",
      time: "09:00",
      timeZone: "Europe/Berlin",
      to: "2026-12-31",
    });
    expect(series.map((item) => item.start)).toEqual([
      "2026-10-18T07:00:00.000Z",
      "2026-10-25T08:00:00.000Z",
    ]);
  });

  it("reads the last Friday of each month", () => {
    const dates = occurrences({ ...base, rule: "FREQ=MONTHLY;BYDAY=-1FR;COUNT=2" }).map(
      (item) => item.date,
    );
    expect(dates).toEqual(["2026-01-30", "2026-02-27"]);
  });

  it("picks the last weekday of each month with BYSETPOS", () => {
    const dates = occurrences({
      ...base,
      rule: "FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1;COUNT=3",
    }).map((item) => item.date);
    expect(dates).toEqual(["2026-01-30", "2026-02-27", "2026-03-31"]);
  });

  it("returns each time of day from BYHOUR, none before the series start", () => {
    expect(
      occurrences({ ...base, rule: "FREQ=DAILY;BYHOUR=9,17;COUNT=3" }).map((item) => item.start),
    ).toEqual(["2026-01-04T14:00:00.000Z", "2026-01-05T06:00:00.000Z", "2026-01-05T14:00:00.000Z"]);
  });

  it("ends at an UNTIL instant in UTC or in the series' wall time", () => {
    const count = (rule: string): number => occurrences({ ...base, rule }).length;
    expect(count("FREQ=DAILY;UNTIL=20260106T070000Z")).toBe(3);
    expect(count("FREQ=DAILY;UNTIL=20260106T065959Z")).toBe(2);
    expect(count("FREQ=DAILY;UNTIL=20260106T095959")).toBe(2);
  });

  it("reads BYYEARDAY and BYWEEKNO", () => {
    expect(
      occurrences({ ...base, to: "2027-12-31", rule: "FREQ=YEARLY;BYYEARDAY=1,-1;COUNT=3" }).map(
        (item) => item.date,
      ),
    ).toEqual(["2026-12-31", "2027-01-01", "2027-12-31"]);
    expect(
      occurrences({ ...base, rule: "FREQ=YEARLY;BYWEEKNO=2;BYDAY=MO;COUNT=1" }).map(
        (item) => item.date,
      ),
    ).toEqual(["2026-01-05"]);
  });

  it("counts only kept dates in the kept COUNT mode", () => {
    const dates = occurrences({
      ...base,
      rule: "FREQ=DAILY;COUNT=4",
      from: "2026-01-05",
      except: ["2026-01-06"],
      countMode: CountMode.Kept,
    }).map((item) => item.date);
    expect(dates).toEqual(["2026-01-05", "2026-01-07", "2026-01-08"]);
    const sessions = occurrences({
      ...base,
      rule: "FREQ=DAILY;COUNT=3",
      calendar,
      countMode: CountMode.Kept,
    }).map((item) => item.date);
    expect(sessions).toEqual(["2026-01-04", "2026-01-06", "2026-01-07"]);
  });
});
