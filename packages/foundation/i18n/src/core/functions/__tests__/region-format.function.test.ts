/**
 * Stackra file contract:
 * Purpose: unit tests of `regionFormat`: the phone's region, units, clock, first weekday (Gregorian in, ISO out) and
 *          zone over the locale's own; a field the phone leaves `null` keeps the locale's value; the account's
 *          override and a declared zone win.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0080 (2026-10-29 note); ADR 0403.
 */
import { describe, expect, it } from "@stackra/testing";

import { HourCycle } from "#core/enums/hour-cycle.enum";
import { regionFormat } from "#core/functions/region-format.function";
import type { DeviceRegion } from "#core/types/device-region.type";
import type { LocaleFormat } from "#core/types/locale-format.type";

const ENGLISH: LocaleFormat = { weekStart: 1, hourCycle: HourCycle.H12 };

const GERMANY: DeviceRegion = {
  regionCode: "DE",
  measurementSystem: "metric",
  uses24hourClock: true,
  firstWeekday: 2,
  timeZone: "Europe/Berlin",
};

describe("regionFormat", () => {
  it("takes the phone's region over the locale's own", () => {
    expect(regionFormat(GERMANY, ENGLISH)).toEqual({
      region: "DE",
      measurementSystem: "metric",
      timeZone: "Europe/Berlin",
      weekStart: 1,
      hourCycle: HourCycle.H23,
    });
  });

  it("turns the Gregorian first weekday into ISO numbering", () => {
    expect(regionFormat({ ...GERMANY, firstWeekday: 1 }, ENGLISH).weekStart).toBe(7);
    expect(regionFormat({ ...GERMANY, firstWeekday: 7 }, ENGLISH).weekStart).toBe(6);
  });

  it("keeps the locale's value where the phone says nothing", () => {
    const silent: DeviceRegion = {
      regionCode: null,
      measurementSystem: null,
      uses24hourClock: null,
      firstWeekday: null,
      timeZone: null,
    };
    expect(regionFormat(silent, ENGLISH)).toEqual({
      region: null,
      measurementSystem: "metric",
      timeZone: null,
      weekStart: 1,
      hourCycle: HourCycle.H12,
    });
  });

  it("lets the account's override and a declared zone win", () => {
    const format = regionFormat(GERMANY, ENGLISH, {
      region: "SA",
      timeZone: "Asia/Riyadh",
      hourCycle: HourCycle.H12,
    });
    expect(format).toMatchObject({ region: "SA", timeZone: "Asia/Riyadh", hourCycle: "h12" });
  });
});
