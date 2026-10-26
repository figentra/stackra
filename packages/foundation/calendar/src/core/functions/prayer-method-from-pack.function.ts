/**
 * Stackra file contract:
 * Purpose: `prayerMethodFromPack`, the prayer-time method a resolved market sets on a date: the value of
 *          `calendar.prayer_times`, checked against `PrayerMethod$`.
 * Boundary: pure over a resolved pack. A market that sets no method is refused with a RangeError, never defaulted:
 *           which method applies is the market's decision.
 * Runtime: isomorphic
 * Governing contract: ADR 0414 (decision 2); ADR 0366 (calendar values come from pack keys under `calendar.`).
 */
import { type ResolvedPack, valueOf } from "@stackra/market-packs";

import { PRAYER_METHOD_SCHEMA } from "#core/constants/prayer-method-schema.constant";
import type { IsoDate } from "#core/types/iso-date.type";
import type { PrayerMethod } from "#core/types/prayer-method.type";

/**
 * The method of `resolved` on `on`.
 *
 * @example
 * const times = new ComputedPrayerTimesDriver(prayerMethodFromPack(resolved, today));
 */
export function prayerMethodFromPack(resolved: ResolvedPack, on: IsoDate): PrayerMethod {
  const value = valueOf(resolved, "calendar.prayer_times", on)?.value;
  if (value === undefined)
    throw new RangeError(`${resolved.market} sets no calendar.prayer_times on ${on}`);
  const parsed = PRAYER_METHOD_SCHEMA.safeParse(value);
  if (!parsed.success)
    throw new RangeError(
      `${resolved.market} sets an invalid calendar.prayer_times on ${on}: ${parsed.error.issues[0]?.message ?? ""}`,
    );
  return parsed.data;
}
