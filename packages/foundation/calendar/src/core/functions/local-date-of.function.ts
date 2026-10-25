/**
 * Stackra file contract:
 * Purpose: `localDateOf`, the local date an instant falls on in a time zone: which business day an order, a filing or
 *          a check-in belongs to.
 * Boundary: pure apart from the runtime's IANA time-zone data. Throws a `RangeError` for an instant without an offset
 *           or an unknown zone.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 5).
 */
import { dateOfDay } from "#core/functions/date-of-day.function";
import { instantMs } from "#core/functions/instant-ms.function";
import { localDay } from "#core/functions/local-day.function";
import type { IsoDate } from "#core/types/iso-date.type";

/**
 * The local date of `instant` in `timeZone`.
 *
 * @example
 * localDateOf("2026-01-04T22:30:00Z", "Asia/Riyadh"); // "2026-01-05"
 */
export function localDateOf(instant: string, timeZone: string): IsoDate {
  return dateOfDay(localDay(instantMs(instant), timeZone));
}
