/**
 * Stackra file contract:
 * Purpose: `minuteOfDay`, a wall-clock time `HH:mm` as minutes after midnight.
 * Boundary: internal. Throws a `RangeError` for anything else (`24:00` included: a span ending at midnight writes
 *           `00:00` and ends on the next day).
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 5).
 */

/** `HH:mm`, 00:00 to 23:59. */
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Minutes after midnight of `time`.
 *
 * @example
 * minuteOfDay("09:30"); // 570
 */
export function minuteOfDay(time: string): number {
  const match = TIME.exec(time);
  if (match === null) throw new RangeError(`Not a time HH:mm: ${time}`);
  return Number(match[1]) * 60 + Number(match[2]);
}
