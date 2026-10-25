/**
 * Stackra file contract:
 * Purpose: `zonedMs`, the epoch milliseconds of a wall-clock time on a day number in a time zone.
 * Boundary: internal. The offset is read twice so a time just after a clock change gets the new offset; a wall time
 *           a clock change skips resolves to an instant beside the gap rather than throwing.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 5).
 */
import { MS_PER_DAY } from "#core/constants/ms-per-day.constant";
import { zoneOffset } from "#core/functions/zone-offset.function";

/**
 * The instant of `minute` minutes after local midnight of day number `day` in `timeZone`.
 *
 * @example
 * zonedMs(0, 60, "UTC"); // 3_600_000
 */
export function zonedMs(day: number, minute: number, timeZone: string): number {
  const wall = day * MS_PER_DAY + minute * 60_000;
  const first = wall - zoneOffset(wall, timeZone);
  return wall - zoneOffset(first, timeZone);
}
