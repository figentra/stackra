/**
 * Stackra file contract:
 * Purpose: the `PrayerTimes` port: the prayer times of a local date at a place, so notifications keep quiet hours
 *          around prayers and a schedule can avoid them.
 * Boundary: an abstract class that is its own token (this package sits below @stackra/container, so drivers are
 *           plain subclasses). The computed driver ships here; a driver over a mosque's or an authority's published
 *           table can follow. Refuses a day it cannot answer with a RangeError.
 * Runtime: isomorphic
 * Governing contract: ADR 0414 (decision 2); ADR 0294 (decisions 16 and 17).
 */
import { Port } from "@stackra/contracts";

import type { IsoDate } from "#core/types/iso-date.type";
import type { PrayerDay } from "#core/types/prayer-day.type";
import type { PrayerPlace } from "#core/types/prayer-place.type";

/** Answers the prayer times of a day. */
export abstract class PrayerTimes extends Port {
  /**
   * The prayer times of `date` (local to `place`) at `place`.
   *
   * @throws RangeError when the date is not `YYYY-MM-DD`, the place is off the globe, or the day has no time for a
   *   prayer under the method.
   */
  abstract on(date: IsoDate, place: PrayerPlace): Promise<PrayerDay>;
}
