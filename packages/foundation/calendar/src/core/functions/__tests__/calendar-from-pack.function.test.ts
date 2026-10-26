/**
 * Stackra file contract:
 * Purpose: unit tests of `calendarFromPack`: the calendar comes from pack keys through an overlay, holiday sets from
 *          every layer are joined, local data replaces the zone and week and adds closures, the result answers
 *          `dayStatus`, and a pack without the required keys is refused.
 * Boundary: test only; packs are built in place with `@stackra/market-packs` types. The calendar data is a made-up
 *           fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0387.
 */
import { type MarketPack, PackStatus, resolvePack } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";
import { ZodError } from "zod";

import { DayStatus } from "#core/enums/day-status.enum";
import { calendarFromPack } from "#core/functions/calendar-from-pack.function";
import { dayStatus } from "#core/functions/day-status.function";

/** A live pack version. */
function pack(market: string, entries: MarketPack["entries"], parent?: string): MarketPack {
  return {
    market,
    ...(parent === undefined ? {} : { extends: parent }),
    version: "1.0.0",
    status: PackStatus.Live,
    entries,
    reviews: [],
    checklist: [],
  };
}

const from = "2020-01-01";
const week = [1, 2, 3, 4, 5].map((day) => ({ day, hours: [{ start: "09:00", end: "17:00" }] }));

const packs = [
  pack("xa", [
    { key: "calendar.time_zone", value: "Asia/Riyadh", from },
    { key: "calendar.working_week", value: week, from },
    { key: "calendar.uncertain_days", value: "closed", from },
    {
      key: "calendar.holidays.national",
      value: [{ kind: "nth_weekday", key: "harvest", month: 11, weekday: 4, nth: 4 }],
      from,
    },
  ]),
  pack(
    "xa-one",
    [
      {
        key: "calendar.holidays.regional",
        value: [{ kind: "gregorian", key: "founding", month: 3, day: 2 }],
        from,
      },
    ],
    "xa",
  ),
];

describe("calendarFromPack", () => {
  it("reads the calendar through an overlay and joins its holiday sets", () => {
    const calendar = calendarFromPack(resolvePack(packs, "xa-one"), "2026-07-01");
    expect(calendar.timeZone).toBe("Asia/Riyadh");
    expect(calendar.uncertainDays).toBe("closed");
    expect(calendar.holidays.map((rule) => rule.key)).toEqual(["harvest", "founding"]);
    expect(dayStatus(calendar, "2026-11-26")).toBe(DayStatus.Holiday);
    expect(dayStatus(calendar, "2026-03-02")).toBe(DayStatus.Holiday);
    expect(dayStatus(calendar, "2026-03-03")).toBe(DayStatus.Working);
  });

  it("lays the location's zone, week and closures over the pack", () => {
    const calendar = calendarFromPack(resolvePack(packs, "xa"), "2026-07-01", {
      timeZone: "Europe/Berlin",
      workingWeek: [{ day: 6, hours: [{ start: "10:00", end: "14:00" }] }],
      holidays: [{ kind: "dated", key: "stocktake", date: "2026-08-01", days: 1 }],
    });
    expect(calendar.timeZone).toBe("Europe/Berlin");
    expect(dayStatus(calendar, "2026-08-01")).toBe(DayStatus.Holiday);
    expect(dayStatus(calendar, "2026-08-03")).toBe(DayStatus.RestDay);
  });

  it("refuses a pack without the calendar keys", () => {
    expect(() => calendarFromPack(resolvePack([pack("xb", [])], "xb"), "2026-07-01")).toThrow(
      ZodError,
    );
  });
});
