/**
 * Stackra file contract:
 * Purpose: the computed driver of the `PrayerTimes` port (driver name `computed`): prayer times from the sun's
 *          position under one market's method, read from the pack with `prayerMethodFromPack`.
 * Boundary: `Driver(PrayerTimes)`; pure arithmetic, no network and no table. The container builds it with no
 *           arguments; `use(method)` sets the market's method, checked against `PrayerMethod$` there, so a bad pack value
 *           fails at start-up, not at the first notification. A day asked before `use`, or one the method cannot answer,
 *           is refused with a RangeError.
 * Runtime: isomorphic
 * Governing contract: ADR 0414 (decision 2: a computed driver; the method is pack data).
 */
import { Driver } from "@stackra/container";

import { PRAYER_METHOD_SCHEMA } from "#core/constants/prayer-method-schema.constant";
import { computePrayerDay } from "#core/functions/compute-prayer-day.function";
import { PrayerTimes } from "#core/ports/prayer-times.port";
import type { IsoDate } from "#core/types/iso-date.type";
import type { PrayerDay } from "#core/types/prayer-day.type";
import type { PrayerMethod } from "#core/types/prayer-method.type";
import type { PrayerPlace } from "#core/types/prayer-place.type";

/**
 * Computes prayer times.
 *
 * @example
 * const times = new ComputedPrayerTimesDriver().use(prayerMethodFromPack(resolved, today));
 * const day = await times.on("2026-03-20", { latitude: 30.04, longitude: 31.24 });
 */
export class ComputedPrayerTimesDriver extends Driver(PrayerTimes) {
  /** The market's method; unset until `use`. */
  private method: PrayerMethod | undefined;

  /**
   * Sets the market's method; a later call wins.
   *
   * @param method - the market's method (the value of `calendar.prayer_times`).
   * @returns this driver, to chain.
   * @throws ZodError when the method does not pass `PrayerMethod$`.
   */
  use(method: PrayerMethod): this {
    this.method = PRAYER_METHOD_SCHEMA.parse(method);
    return this;
  }

  /** Implements `PrayerTimes.on`, documented there; refuses with a RangeError before `use`. */
  async on(date: IsoDate, place: PrayerPlace): Promise<PrayerDay> {
    if (this.method === undefined)
      throw new RangeError("ComputedPrayerTimesDriver has no method: call use(method) first");
    return computePrayerDay(date, place, this.method);
  }
}
