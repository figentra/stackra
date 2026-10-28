/**
 * Stackra file contract:
 * Purpose: unit tests of `deviceRegion()` and `deviceLanguageTags()`: they read expo-localization's first locale and
 *          calendar, and a phone that reports nothing reads as `null` fields and no tags.
 * Boundary: test only; expo-localization is mocked, and the readers are also handed in as fakes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0080 (2026-10-29 note).
 */
import { describe, expect, it } from "@stackra/testing";
import type { getCalendars, getLocales } from "expo-localization";
import { vi } from "vitest";

import { deviceLanguageTags } from "#native/functions/device-language-tags.function";
import { deviceRegion } from "#native/functions/device-region.function";

vi.mock("expo-localization", () => ({
  getLocales: () => [{ languageTag: "de-DE", regionCode: "DE", measurementSystem: "metric" }],
  getCalendars: () => [{ uses24hourClock: true, firstWeekday: 2, timeZone: "Europe/Berlin" }],
}));

const none = (() => []) as unknown as typeof getLocales & typeof getCalendars;

describe("deviceRegion", () => {
  it("reads the phone's region, units, clock, first weekday and zone", () => {
    expect(deviceRegion()).toEqual({
      regionCode: "DE",
      measurementSystem: "metric",
      uses24hourClock: true,
      firstWeekday: 2,
      timeZone: "Europe/Berlin",
    });
  });

  it("reads null where the phone reports nothing", () => {
    expect(deviceRegion(none, none)).toEqual({
      regionCode: null,
      measurementSystem: null,
      uses24hourClock: null,
      firstWeekday: null,
      timeZone: null,
    });
  });
});

describe("deviceLanguageTags", () => {
  it("lists the phone's language tags, nearest first", () => {
    expect(deviceLanguageTags()).toEqual(["de-DE"]);
    expect(
      deviceLanguageTags((() => [
        { languageTag: "ar-SA" },
        { languageTag: "en-GB" },
      ]) as unknown as typeof getLocales),
    ).toEqual(["ar-SA", "en-GB"]);
    expect(deviceLanguageTags(none)).toEqual([]);
  });
});
