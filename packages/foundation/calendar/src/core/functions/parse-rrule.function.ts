/**
 * Stackra file contract:
 * Purpose: `parseRrule`, RFC 5545 RRULE text to a `RecurrenceRule`.
 * Boundary: internal. Supports FREQ (DAILY, WEEKLY, MONTHLY, YEARLY), INTERVAL, COUNT, UNTIL (a date, or a date and
 *           time, UTC or wall time), BYDAY (with positions in the month, or in the year for YEARLY without BYMONTH),
 *           BYMONTHDAY, BYMONTH, BYYEARDAY, BYWEEKNO, BYHOUR, BYMINUTE, BYSECOND, BYSETPOS and WKST. Refused, each with
 *           its reason in the message (ADR 0387): FREQ=HOURLY, MINUTELY and SECONDLY; RSCALE and SKIP (RFC 7529);
 *           BYSECOND=60. Also refused, as RFC 5545 forbids them: an unknown or repeated part, COUNT with UNTIL,
 *           BYYEARDAY with DAILY, WEEKLY or MONTHLY, BYWEEKNO outside YEARLY, BYMONTHDAY with WEEKLY, a BYDAY position
 *           with DAILY, WEEKLY or BYWEEKNO, and BYSETPOS with no other BY part. Every refusal is a `RangeError`; no part
 *           is ignored.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 6) as amended by ADR 0387.
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
  "BYYEARDAY",
  "BYWEEKNO",
  "BYHOUR",
  "BYMINUTE",
  "BYSECOND",
  "BYSETPOS",
  "WKST",
]);

/** Parts refused on purpose, with the reason a caller reads in the error. */
const REFUSED: Readonly<Record<string, string>> = {
  RSCALE:
    "RFC 7529 calendar scales are not read; a yearly Hijri date is a holiday rule of kind hijri, and ICU, not RRULE, converts it",
  SKIP: "RFC 7529 SKIP only means something with RSCALE, which is refused",
};

/** Frequencies refused on purpose. */
const SUB_DAILY = new Set(["HOURLY", "MINUTELY", "SECONDLY"]);

/** The frequencies read. */
const FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

/** A whole number within `[min, max]`; zero only when `min` is zero. */
function whole(text: string, min: number, max: number, part: string): number {
  const value = /^[+-]?\d+$/.test(text) ? Number(text) : Number.NaN;
  if (!Number.isInteger(value) || value < min || value > max || (value === 0 && min !== 0))
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
 * parseRrule("FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1").bySetPos; // [-1]
 */
export function parseRrule(text: string): RecurrenceRule {
  const parts = new Map<string, string>();
  for (const part of text.replace(/^RRULE:/i, "").split(";")) {
    const [name, value, extra] = part.split("=");
    const key = name?.toUpperCase() ?? "";
    const refused = REFUSED[key];
    if (refused !== undefined) throw new RangeError(`RRULE ${key} refused: ${refused}`);
    if (!SUPPORTED.has(key)) throw new RangeError(`RRULE part not supported: ${part}`);
    if (value === undefined || value === "" || extra !== undefined || parts.has(key))
      throw new RangeError(`RRULE part malformed or repeated: ${part}`);
    parts.set(key, value.toUpperCase());
  }
  const freqText = parts.get("FREQ") ?? "";
  if (SUB_DAILY.has(freqText))
    throw new RangeError(
      `RRULE FREQ=${freqText} refused: a series here is dates at wall times; repetition within a day is working hours or slots (openIntervals, findSlots)`,
    );
  const freq = FREQUENCIES.find((candidate) => candidate === freqText);
  if (freq === undefined) throw new RangeError(`RRULE needs FREQ of ${FREQUENCIES.join(", ")}`);
  const list = (key: string): string[] => parts.get(key)?.split(",") ?? [];

  const untilText = parts.get("UNTIL");
  const untilMatch =
    untilText === undefined
      ? null
      : /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(untilText);
  if (untilText !== undefined && untilMatch === null)
    throw new RangeError(`RRULE UNTIL malformed: ${untilText}`);
  const until =
    untilMatch === null ? undefined : `${untilMatch[1]}-${untilMatch[2]}-${untilMatch[3]}`;
  if (until !== undefined) dayNumber(until);
  const untilTime =
    untilMatch?.[4] === undefined
      ? undefined
      : {
          second:
            whole(untilMatch[4], 0, 23, "UNTIL hour") * 3600 +
            whole(untilMatch[5] ?? "", 0, 59, "UNTIL minute") * 60 +
            whole(untilMatch[6] ?? "", 0, 59, "UNTIL second"),
          utc: untilMatch[7] === "Z",
        };

  const countText = parts.get("COUNT");
  const count =
    countText === undefined ? undefined : whole(countText, 1, Number.MAX_SAFE_INTEGER, "COUNT");
  if (count !== undefined && until !== undefined)
    throw new RangeError("RRULE has both COUNT and UNTIL");

  const byMonth = list("BYMONTH").map((value) => whole(value, 1, 12, "BYMONTH"));
  const byYearDay = list("BYYEARDAY").map((value) => whole(value, -366, 366, "BYYEARDAY"));
  if (byYearDay.length > 0 && freq !== "YEARLY")
    throw new RangeError(`RRULE BYYEARDAY is not allowed with FREQ=${freq}`);
  const byWeekNo = list("BYWEEKNO").map((value) => whole(value, -53, 53, "BYWEEKNO"));
  if (byWeekNo.length > 0 && freq !== "YEARLY")
    throw new RangeError(`RRULE BYWEEKNO is only allowed with FREQ=YEARLY`);
  const byMonthDay = list("BYMONTHDAY").map((value) => whole(value, -31, 31, "BYMONTHDAY"));
  if (byMonthDay.length > 0 && freq === "WEEKLY")
    throw new RangeError("RRULE BYMONTHDAY is not allowed with FREQ=WEEKLY");

  const inYear = freq === "YEARLY" && byMonth.length === 0;
  const byDay = list("BYDAY").map((value) => {
    const match = /^([+-]?\d{1,2})?([A-Z]{2})$/.exec(value);
    if (match === null) throw new RangeError(`RRULE BYDAY malformed: ${value}`);
    if (match[1] !== undefined && (freq === "DAILY" || freq === "WEEKLY" || byWeekNo.length > 0))
      throw new RangeError(`RRULE BYDAY position needs a month or a year: ${value}`);
    const nth =
      match[1] === undefined
        ? undefined
        : whole(match[1], inYear ? -53 : -5, inYear ? 53 : 5, "BYDAY");
    return { weekday: weekday(match[2] ?? ""), nth };
  });

  const byHour = list("BYHOUR").map((value) => whole(value, 0, 23, "BYHOUR"));
  const byMinute = list("BYMINUTE").map((value) => whole(value, 0, 59, "BYMINUTE"));
  const bySecond = list("BYSECOND").map((value) => {
    if (Number(value) === 60)
      throw new RangeError(
        "RRULE BYSECOND=60 refused: a leap second has no instant in ECMAScript time",
      );
    return whole(value, 0, 59, "BYSECOND");
  });
  const bySetPos = list("BYSETPOS").map((value) => whole(value, -366, 366, "BYSETPOS"));
  const byParts =
    byDay.length +
    byMonthDay.length +
    byMonth.length +
    byYearDay.length +
    byWeekNo.length +
    byHour.length +
    byMinute.length +
    bySecond.length;
  if (bySetPos.length > 0 && byParts === 0)
    throw new RangeError("RRULE BYSETPOS needs another BY part");

  return {
    freq,
    interval: whole(parts.get("INTERVAL") ?? "1", 1, Number.MAX_SAFE_INTEGER, "INTERVAL"),
    count,
    until,
    untilTime,
    byDay,
    byMonthDay,
    byMonth,
    byYearDay,
    byWeekNo,
    byHour,
    byMinute,
    bySecond,
    bySetPos,
    weekStart: weekday(parts.get("WKST") ?? "MO"),
  };
}
