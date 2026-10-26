/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: exactly the public values are exported (the helpers stay internal), the `$` name is the shipped schema, and the public types resolve.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366; ADR 0387.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { BUSINESS_CALENDAR_SCHEMA } from "#core/constants/business-calendar-schema.constant";
import { PRAYER_METHOD_SCHEMA } from "#core/constants/prayer-method-schema.constant";
import type {
  BusinessCalendar,
  HolidayRule,
  PrayerDay,
  PrayerMethod,
  PrayerPlace,
} from "#core/index";
import * as entry from "#core/index";

describe("@stackra/calendar", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "BusinessCalendar$",
      "ComputedPrayerTimesDriver",
      "CountMode",
      "DayStatus",
      "HighLatitudeRule",
      "HijriDate$",
      "HolidayKind",
      "IcalStatus",
      "IsoDate$",
      "LeapBirthday",
      "PrayerMethod$",
      "PrayerTimes",
      "UncertainDays",
      "WorkingWeek$",
      "addBusinessDays",
      "addWorkingMinutes",
      "ageOn",
      "calendarFromPack",
      "dayStatus",
      "findSlots",
      "gregorianOf",
      "hijriOf",
      "icalFeed",
      "instantOf",
      "leapBirthdayFromPack",
      "localDateOf",
      "occurrences",
      "openIntervals",
      "prayerMethodFromPack",
    ]);
  });

  it("exports the shipped schema under its generated name", () => {
    expect(entry.BusinessCalendar$).toBe(BUSINESS_CALENDAR_SCHEMA);
    expect(entry.PrayerMethod$).toBe(PRAYER_METHOD_SCHEMA);
  });

  it("resolves its public types", () => {
    expectTypeOf<BusinessCalendar["holidays"][number]>().toEqualTypeOf<HolidayRule>();
    expectTypeOf<PrayerMethod["asrFactor"]>().toEqualTypeOf<1 | 2>();
    expectTypeOf<PrayerDay["fajr"]>().toEqualTypeOf<string>();
    expectTypeOf<PrayerPlace["elevation"]>().toEqualTypeOf<number | undefined>();
  });
});
