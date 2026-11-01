/**
 * Stackra file contract:
 * Purpose: `addCalendarMonths`, an instant moved by whole calendar months on the wall clock of an IANA time zone: the
 *          renewal date of a billing subscription, membership cycle or selling plan in the tenant's or Market's zone
 *          (31 Jan, 28 or 29 Feb, 31 Mar).
 * Boundary: public and pure; no clock read, no dependency. The zone's offsets come from the runtime's IANA database
 *           through `Intl.DateTimeFormat` (ADR 0366, decision 5), one formatter per zone kept for the life of the
 *           process. A wall time that a spring-forward change skips resolves to the first valid instant after the gap;
 *           an ambiguous wall time of a fall-back change takes the earlier offset. Throws a `RangeError` for an
 *           invalid date, a `months` or `anchorDay` that is not a whole number (`anchorDay` 1 to 31), or an unknown
 *           zone. Years before 100 CE and offsets with a sub-second part are not supported.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); ADR 0366 (decision 5: time zones); STA-1725.
 */

/** One formatter per zone. */
const FORMATS = new Map<string, Intl.DateTimeFormat>();

const MS_PER_DAY = 86_400_000;

/** The formatter of `timeZone`; an unknown zone throws the `RangeError` of `Intl.DateTimeFormat`. */
function formatOf(timeZone: string): Intl.DateTimeFormat {
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
  return format;
}

/** The offset of the zone at `ms` (local wall time minus UTC), in milliseconds. */
function offsetAt(format: Intl.DateTimeFormat, ms: number): number {
  const parts = Object.fromEntries(format.formatToParts(ms).map((part) => [part.type, part.value]));
  const second = Math.floor(ms / 1000) * 1000;
  const wall = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return wall - second;
}

/**
 * Returns the instant `months` calendar months after `instant` (before it when negative) on the wall clock of
 * `timeZone`, with the same time of day.
 *
 * The day is `min(anchorDay ?? the day of instant in timeZone, the last day of the target month)`. Pass `anchorDay`
 * when a chain is built from the previous result, so the day does not drift: 31 Jan, 28 Feb, 31 Mar, not 28 Mar.
 *
 * Daylight saving: a wall time the target day skips (a spring-forward gap) moves forward to the first valid instant
 * after the gap; an ambiguous wall time (a fall-back change) takes the earlier offset, the first of its two
 * occurrences.
 *
 * @param instant - the instant to start from; not mutated.
 * @param months - whole months to add; negative subtracts.
 * @param timeZone - an IANA zone name such as `Europe/Berlin` or `UTC`.
 * @param anchorDay - the day of month to keep across months, 1 to 31; defaults to the day of `instant` in `timeZone`.
 * @returns a new `Date`.
 * @throws RangeError for an invalid `instant`, a non-integer `months` or `anchorDay`, or an unknown `timeZone`.
 *
 * @example
 * addCalendarMonths(new Date("2026-01-31T10:00:00Z"), 1, "Europe/Berlin"); // 2026-02-28T10:00:00.000Z
 * addCalendarMonths(new Date("2026-01-31T10:00:00Z"), 3, "UTC", 31); // 2026-04-30T10:00:00.000Z
 */
export function addCalendarMonths(
  instant: Date,
  months: number,
  timeZone: string,
  anchorDay?: number,
): Date {
  const start = instant.getTime();
  if (Number.isNaN(start)) throw new RangeError("addCalendarMonths: the instant is invalid");
  if (!Number.isSafeInteger(months))
    throw new RangeError(`addCalendarMonths: months must be a whole number, got ${months}`);
  if (anchorDay !== undefined && (!Number.isInteger(anchorDay) || anchorDay < 1 || anchorDay > 31))
    throw new RangeError(
      `addCalendarMonths: anchorDay must be a whole number 1 to 31, got ${anchorDay}`,
    );
  const format = formatOf(timeZone);
  const offset = (ms: number): number => offsetAt(format, ms);

  // The wall clock of the instant, read as UTC fields.
  const local = new Date(start + offset(start));
  const total = local.getUTCFullYear() * 12 + local.getUTCMonth() + months;
  const year = Math.floor(total / 12);
  const month = total - year * 12;
  // Day 0 of the month after the target is the target's last day.
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const wall = Date.UTC(
    year,
    month,
    Math.min(anchorDay ?? local.getUTCDate(), lastDay),
    local.getUTCHours(),
    local.getUTCMinutes(),
    local.getUTCSeconds(),
    local.getUTCMilliseconds(),
  );

  // The offsets a day either side are the two the target day can have; keep those that read back as the wall time.
  const before = offset(wall - MS_PER_DAY);
  const after = offset(wall + MS_PER_DAY);
  const valid = [...new Set([before, after])]
    .map((zoneOffset) => wall - zoneOffset)
    .filter((candidate) => offset(candidate) === wall - candidate);
  if (valid.length > 0) return new Date(Math.min(...valid));

  // A gap: bisect for the first instant that has the new offset.
  let low = wall - after;
  let high = wall - before;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (offset(middle) === before) low = middle;
    else high = middle;
  }
  return new Date(high);
}
