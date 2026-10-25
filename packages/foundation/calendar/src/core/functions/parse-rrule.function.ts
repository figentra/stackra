/**
 * Stackra file contract:
 * Purpose: `parseRrule`, RFC 5545 RRULE text to a `RecurrenceRule`.
 * Boundary: internal. Supports FREQ (DAILY, WEEKLY, MONTHLY, YEARLY), INTERVAL, COUNT, UNTIL, BYDAY, BYMONTHDAY,
 *           BYMONTH and WKST. Any other part, a repeated part, COUNT with UNTIL, or a signed BYDAY outside a month
 *           (DAILY, WEEKLY, or YEARLY without BYMONTH) throws a `RangeError` rather than being ignored.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 6).
 */
import { dayNumber } from "#core/functions/day-number.function";
import type { RecurrenceRule } from "#core/types/recurrence-rule.type";

/** The two-letter weekdays, Monday first, so index + 1 is the ISO weekday. */
const WEEKDAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

/** The parts read. */
const SUPPORTED = new Set([
  "FREQ",
  "INTERVAL",
  "COUNT",
  "UNTIL",
  "BYDAY",
  "BYMONTHDAY",
  "BYMONTH",
  "WKST",
]);

/** The frequencies read. */
const FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

/** A whole number within `[min, max]`, never zero. */
function whole(text: string, min: number, max: number, part: string): number {
  const value = /^[+-]?\d+$/.test(text) ? Number(text) : Number.NaN;
  if (!Number.isInteger(value) || value < min || value > max || value === 0)
    throw new RangeError(`RRULE ${part} out of range: ${text}`);
  return value;
}

/** An ISO weekday from a two-letter code. */
function weekday(code: string): number {
  const index = WEEKDAYS.indexOf(code);
  if (index < 0) throw new RangeError(`RRULE weekday not known: ${code}`);
  return index + 1;
}

/**
 * The parsed form of `text`.
 *
 * @example
 * parseRrule("FREQ=MONTHLY;BYDAY=-1FR").byDay; // [{ weekday: 5, nth: -1 }]
 */
export function parseRrule(text: string): RecurrenceRule {
  const parts = new Map<string, string>();
  for (const part of text.replace(/^RRULE:/i, "").split(";")) {
    const [name, value, extra] = part.split("=");
    const key = name?.toUpperCase() ?? "";
    if (!SUPPORTED.has(key)) throw new RangeError(`RRULE part not supported: ${part}`);
    if (value === undefined || value === "" || extra !== undefined || parts.has(key))
      throw new RangeError(`RRULE part malformed or repeated: ${part}`);
    parts.set(key, value.toUpperCase());
  }
  const freq = FREQUENCIES.find((candidate) => candidate === parts.get("FREQ"));
  if (freq === undefined) throw new RangeError(`RRULE needs FREQ of ${FREQUENCIES.join(", ")}`);
  const list = (key: string): string[] => parts.get(key)?.split(",") ?? [];
  const untilText = parts.get("UNTIL");
  const untilMatch =
    untilText === undefined ? null : /^(\d{4})(\d{2})(\d{2})(T\d{6}Z?)?$/.exec(untilText);
  if (untilText !== undefined && untilMatch === null)
    throw new RangeError(`RRULE UNTIL malformed: ${untilText}`);
  const until =
    untilMatch === null ? undefined : `${untilMatch[1]}-${untilMatch[2]}-${untilMatch[3]}`;
  if (until !== undefined) dayNumber(until);
  const countText = parts.get("COUNT");
  const count =
    countText === undefined ? undefined : whole(countText, 1, Number.MAX_SAFE_INTEGER, "COUNT");
  if (count !== undefined && until !== undefined)
    throw new RangeError("RRULE has both COUNT and UNTIL");
  const byMonth = list("BYMONTH").map((value) => whole(value, 1, 12, "BYMONTH"));
  const byDay = list("BYDAY").map((value) => {
    const match = /^([+-]?\d{1,2})?([A-Z]{2})$/.exec(value);
    if (match === null) throw new RangeError(`RRULE BYDAY malformed: ${value}`);
    const nth = match[1] === undefined ? undefined : whole(match[1], -5, 5, "BYDAY");
    if (
      nth !== undefined &&
      (freq === "DAILY" || freq === "WEEKLY" || (freq === "YEARLY" && byMonth.length === 0))
    )
      throw new RangeError(`RRULE BYDAY position needs a month: ${value}`);
    return { weekday: weekday(match[2] ?? ""), nth };
  });
  return {
    freq,
    interval: whole(parts.get("INTERVAL") ?? "1", 1, Number.MAX_SAFE_INTEGER, "INTERVAL"),
    count,
    until,
    byDay,
    byMonthDay: list("BYMONTHDAY").map((value) => whole(value, -31, 31, "BYMONTHDAY")),
    byMonth,
    weekStart: weekday(parts.get("WKST") ?? "MO"),
  };
}
