/**
 * Stackra file contract:
 * Purpose: `zonedTime`, an instant as the wall clock of an IANA time zone shows it, with the UTC offset.
 * Boundary: a pure function over `Intl.DateTimeFormat`; the zone comes from pack options, never from the host's
 *           locale. An unknown zone is a `RangeError` from `Intl`.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 2 and 8).
 */
import type { ZonedTime } from "#core/types/zoned-time.type";

/**
 * Local date, time and offset.
 *
 * @example
 * zonedTime(new Date("2026-01-01T12:00:00Z"), "Asia/Riyadh");
 * // { date: "2026-01-01", time: "15:00:00", offset: "+03:00" }
 */
export function zonedTime(instant: Date, timeZone: string): ZonedTime {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "longOffset",
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const zone = part("timeZoneName");
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}:${part("second")}`,
    offset: zone === "GMT" ? "+00:00" : zone.slice(3),
  };
}
