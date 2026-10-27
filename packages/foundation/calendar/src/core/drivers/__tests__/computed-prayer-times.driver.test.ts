/**
 * Stackra file contract:
 * Purpose: unit tests of `ComputedPrayerTimesDriver`: it is the `PrayerTimes` port; Makkah under a fixed-minutes Isha
 *          and Cairo under an Isha angle land within a minute of the reference computation; a high-latitude summer
 *          day is placed by the rule, refused under `none`; a bad method, date or place is refused.
 * Boundary: test only. The methods are made-up fixtures written the way a pack writes them, not any market's
 *           decision; the expected instants come from an independent implementation of the same formulas.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0414.
 */
import { describe, expect, it } from "@stackra/testing";

import { ComputedPrayerTimesDriver } from "#core/drivers/computed-prayer-times.driver";
import { HighLatitudeRule } from "#core/enums/high-latitude-rule.enum";
import { PrayerTimes } from "#core/ports/prayer-times.port";
import type { PrayerDay } from "#core/types/prayer-day.type";
import type { PrayerMethod } from "#core/types/prayer-method.type";

const MINUTES: PrayerMethod = {
  fajrAngle: 18.5,
  ishaMinutes: 90,
  asrFactor: 1,
  maghribMinutes: 0,
  highLatitude: HighLatitudeRule.None,
};

const ANGLES: PrayerMethod = {
  fajrAngle: 19.5,
  ishaAngle: 17.5,
  asrFactor: 1,
  maghribMinutes: 0,
  highLatitude: HighLatitudeRule.None,
};

/** Asserts each time is within a minute of the expected instant. */
function near(day: PrayerDay, expected: Omit<PrayerDay, "date">): void {
  for (const [prayer, instant] of Object.entries(expected))
    expect(
      Math.abs(Date.parse(day[prayer as keyof typeof expected]) - Date.parse(instant)),
      prayer,
    ).toBeLessThanOrEqual(60_000);
}

describe("ComputedPrayerTimesDriver", () => {
  it("computes a day with Isha as minutes after Maghrib", async () => {
    const times = new ComputedPrayerTimesDriver().use(MINUTES);
    expect(times).toBeInstanceOf(PrayerTimes);
    const day = await times.on("2026-01-01", { latitude: 21.4225, longitude: 39.8262 });
    expect(day.date).toBe("2026-01-01");
    near(day, {
      fajr: "2026-01-01T02:37:00.000Z",
      sunrise: "2026-01-01T03:59:00.000Z",
      dhuhr: "2026-01-01T09:24:00.000Z",
      asr: "2026-01-01T12:29:00.000Z",
      maghrib: "2026-01-01T14:50:00.000Z",
      isha: "2026-01-01T16:20:00.000Z",
    });
    expect(Date.parse(day.isha) - Date.parse(day.maghrib)).toBe(90 * 60_000);
  });

  it("computes a day with an Isha angle", async () => {
    near(
      await new ComputedPrayerTimesDriver().use(ANGLES).on("2026-03-20", {
        latitude: 30.0444,
        longitude: 31.2357,
      }),
      {
        fajr: "2026-03-20T02:32:00.000Z",
        sunrise: "2026-03-20T03:59:00.000Z",
        dhuhr: "2026-03-20T10:03:00.000Z",
        asr: "2026-03-20T13:30:00.000Z",
        maghrib: "2026-03-20T16:06:00.000Z",
        isha: "2026-03-20T17:24:00.000Z",
      },
    );
  });

  it("places Fajr and Isha by the high-latitude rule, and refuses the day without one", async () => {
    const stockholm = { latitude: 59.3293, longitude: 18.0686 };
    const method = { ...ANGLES, fajrAngle: 18, ishaAngle: 17 };
    const day = await new ComputedPrayerTimesDriver()
      .use({
        ...method,
        highLatitude: HighLatitudeRule.AngleBased,
      })
      .on("2026-06-21", stockholm);
    near(day, {
      fajr: "2026-06-20T23:54:00.000Z",
      sunrise: "2026-06-21T01:31:00.000Z",
      dhuhr: "2026-06-21T10:50:00.000Z",
      asr: "2026-06-21T15:30:00.000Z",
      maghrib: "2026-06-21T20:08:00.000Z",
      isha: "2026-06-21T21:40:00.000Z",
    });
    await expect(
      new ComputedPrayerTimesDriver().use(method).on("2026-06-21", stockholm),
    ).rejects.toThrow(RangeError);
  });

  it("refuses a day before a method is set", async () => {
    await expect(
      new ComputedPrayerTimesDriver().on("2026-01-01", { latitude: 0, longitude: 0 }),
    ).rejects.toThrow(RangeError);
  });

  it("refuses a bad method, date or place", async () => {
    expect(() => new ComputedPrayerTimesDriver().use({ ...ANGLES, ishaMinutes: 90 })).toThrow();
    const times = new ComputedPrayerTimesDriver().use(MINUTES);
    await expect(times.on("2026-02-30", { latitude: 0, longitude: 0 })).rejects.toThrow(RangeError);
    await expect(times.on("2026-01-01", { latitude: 91, longitude: 0 })).rejects.toThrow(
      RangeError,
    );
    await expect(times.on("2026-12-21", { latitude: 80, longitude: 0 })).rejects.toThrow(
      RangeError,
    );
  });
});
