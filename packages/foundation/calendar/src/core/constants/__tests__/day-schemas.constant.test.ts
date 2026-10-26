/**
 * Stackra file contract:
 * Purpose: unit tests of `IsoDate$`, `HijriDate$` and `WorkingWeek$`: valid values parse, and an impossible date, an
 *          out-of-range Hijri month and a repeated weekday are refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); STA-1284.
 */
import { describe, expect, it } from "@stackra/testing";

import { HIJRI_DATE_SCHEMA } from "#core/constants/hijri-date-schema.constant";
import { ISO_DATE_SCHEMA } from "#core/constants/iso-date-schema.constant";
import { WORKING_WEEK_SCHEMA } from "#core/constants/working-week-schema.constant";

describe("IsoDate$, HijriDate$ and WorkingWeek$", () => {
  it("parses valid values", () => {
    expect(ISO_DATE_SCHEMA.parse("2026-10-26")).toBe("2026-10-26");
    expect(HIJRI_DATE_SCHEMA.parse({ year: 1448, month: 5, day: 4 })).toEqual({
      year: 1448,
      month: 5,
      day: 4,
    });
    const week = [{ day: 7, hours: [{ start: "09:00", end: "17:00" }] }];
    expect(WORKING_WEEK_SCHEMA.parse(week)).toEqual(week);
  });

  it("refuses an impossible date, a month 13 and a repeated weekday", () => {
    expect(ISO_DATE_SCHEMA.safeParse("2026-02-30").success).toBe(false);
    expect(HIJRI_DATE_SCHEMA.safeParse({ year: 1448, month: 13, day: 1 }).success).toBe(false);
    const hours = [{ start: "09:00", end: "17:00" }];
    expect(
      WORKING_WEEK_SCHEMA.safeParse([
        { day: 1, hours },
        { day: 1, hours },
      ]).success,
    ).toBe(false);
  });
});
