/**
 * Stackra file contract:
 * Purpose: `startOfZonedDay`, the instant of local midnight, in an IANA time zone, of the day (or month) an instant
 *          falls in; the boundary `ctx.startOfDay()` and `ctx.period(...)` use.
 * Boundary: pure, on the platform's `Intl.DateTimeFormat` (no time-zone library). Settles the zone's offset twice, so
 *           a daylight-saving change on that day still lands on its midnight. Second precision.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 1: the time zone is on the context).
 */

/** The wall-clock fields of `instant` in `timeZone`. */
function wallClock(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const field = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: field("year"),
    month: field("month"),
    day: field("day"),
    asUtc: Date.UTC(
      field("year"),
      field("month") - 1,
      field("day"),
      field("hour"),
      field("minute"),
      field("second"),
    ),
  };
}

/** How far `timeZone`'s wall clock is ahead of UTC at `time`, in milliseconds. */
function offsetAt(time: number, timeZone: string): number {
  return wallClock(new Date(time), timeZone).asUtc - Math.floor(time / 1000) * 1000;
}

/**
 * Local midnight of the day (or of the first day of the month) `instant` falls in, in `timeZone`.
 *
 * @throws RangeError when `timeZone` is not an IANA time zone.
 * @example
 * startOfZonedDay(new Date("2026-10-24T22:30:00Z"), "Asia/Riyadh"); // 2026-10-24T21:00:00.000Z
 */
export function startOfZonedDay(
  instant: Date,
  timeZone: string,
  unit: "day" | "month" = "day",
): Date {
  const { year, month, day } = wallClock(instant, timeZone);
  const guess = Date.UTC(year, month - 1, unit === "month" ? 1 : day);
  // Two passes: the offset at the guess, then at the corrected instant, settle a daylight-saving change.
  const first = guess - offsetAt(guess, timeZone);
  return new Date(guess - offsetAt(first, timeZone));
}
