/**
 * Stackra file contract:
 * Purpose: `localDay`, the day number of the local date an instant falls on in a time zone.
 * Boundary: internal; `localDateOf` is its public form.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 5).
 */
import { MS_PER_DAY } from "#core/constants/ms-per-day.constant";
import { zoneOffset } from "#core/functions/zone-offset.function";

/**
 * The local day number of `ms` in `timeZone`.
 *
 * @example
 * localDay(0, "UTC"); // 0
 */
export function localDay(ms: number, timeZone: string): number {
  return Math.floor((ms + zoneOffset(ms, timeZone)) / MS_PER_DAY);
}
