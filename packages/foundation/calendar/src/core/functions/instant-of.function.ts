/**
 * Stackra file contract:
 * Purpose: `instantOf`, the UTC instant of a local date and wall-clock time in a time zone: the start of a business
 *          day for a report, an opening time, a session start.
 * Boundary: pure apart from the runtime's IANA time-zone data. A wall time skipped by a clock change resolves to an
 *           instant beside the gap. Throws a `RangeError` for a malformed date, time or unknown zone.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 5: time zones).
 */
import { dayNumber } from "#core/functions/day-number.function";
import { minuteOfDay } from "#core/functions/minute-of-day.function";
import { zonedMs } from "#core/functions/zoned-ms.function";
import type { IsoDate } from "#core/types/iso-date.type";

/**
 * The instant, ISO 8601 in UTC, of `time` on `date` in `timeZone`.
 *
 * @example
 * instantOf("2026-01-04", "09:00", "Asia/Riyadh"); // "2026-01-04T06:00:00.000Z"
 */
export function instantOf(date: IsoDate, time: string, timeZone: string): string {
  return new Date(zonedMs(dayNumber(date), minuteOfDay(time), timeZone)).toISOString();
}
