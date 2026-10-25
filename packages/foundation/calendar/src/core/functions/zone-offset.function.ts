/**
 * Stackra file contract:
 * Purpose: `zoneOffset`, the UTC offset in milliseconds that a time zone has at one instant, read from the runtime's
 *          time-zone database through `Intl`.
 * Boundary: internal. One formatter per zone is kept for the life of the process. An unknown zone throws the
 *           `RangeError` of `Intl.DateTimeFormat`.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 5: time zones from the runtime's IANA database).
 */

/** One formatter per zone. */
const FORMATS = new Map<string, Intl.DateTimeFormat>();

/**
 * The offset of `timeZone` at `ms` (local wall time minus UTC).
 *
 * @example
 * zoneOffset(0, "UTC"); // 0
 */
export function zoneOffset(ms: number, timeZone: string): number {
  let format = FORMATS.get(timeZone);
  if (format === undefined) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    FORMATS.set(timeZone, format);
  }
  const parts = Object.fromEntries(format.formatToParts(ms).map((part) => [part.type, part.value]));
  const wall = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return wall - Math.floor(ms / 1000) * 1000;
}
