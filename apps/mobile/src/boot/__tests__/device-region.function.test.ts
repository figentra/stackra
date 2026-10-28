/**
 * Stackra file contract:
 * Purpose: proves `deviceRegion` maps expo-localization's first locale and calendar into `DeviceRegion`, `null` where
 *          the platform leaves a field out or returns nothing.
 * Boundary: the functions alone; expo-localization is mocked, so no native module loads.
 * Runtime: node
 * Governing contract: ADR 0080 (2026-10-29 note); ADR 0022 (test placement).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { deviceRegion } from "../device-region.function";

const { getLocales, getCalendars } = vi.hoisted(() => ({
  getLocales: vi.fn<() => object[]>(() => []),
  getCalendars: vi.fn<() => object[]>(() => []),
}));
vi.mock("expo-localization", () => ({ getLocales, getCalendars }));

describe("deviceRegion", () => {
  beforeEach(() => {
    getLocales.mockReturnValue([]);
    getCalendars.mockReturnValue([]);
  });

  it("reads the phone's region, units, clock, first weekday and time zone", () => {
    getLocales.mockReturnValue([
      { languageTag: "en-DE", regionCode: "DE", measurementSystem: "metric" },
    ]);
    getCalendars.mockReturnValue([
      { uses24hourClock: true, firstWeekday: 2, timeZone: "Europe/Berlin" },
    ]);
    expect(deviceRegion()).toEqual({
      regionCode: "DE",
      measurementSystem: "metric",
      uses24hourClock: true,
      firstWeekday: 2,
      timeZone: "Europe/Berlin",
    });
  });

  it("reads null where the phone says nothing", () => {
    expect(deviceRegion()).toEqual({
      regionCode: null,
      measurementSystem: null,
      uses24hourClock: null,
      firstWeekday: null,
      timeZone: null,
    });
  });
});
