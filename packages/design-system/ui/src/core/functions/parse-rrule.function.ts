/**
 * Stackra file contract:
 * Purpose: `parseRrule(text)`, RFC 5545 `RRULE` text (with or without the `RRULE:` prefix) read back into the
 *          `RecurrenceRule` the editors work on; `undefined` for text it cannot read: no or an unknown `FREQ`, a
 *          number out of range, or a calendar this package does not know.
 * Boundary: pure; the text may come from storage or another app, so every part is checked. Parts the editors have no
 *           control for (`BYHOUR`, `BYSETPOS`, `WKST`, …) are dropped, and a time on `UNTIL` is cut to its date.
 * Runtime: isomorphic
 * Governing contract: RFC 5545 section 3.3.10; RFC 7529 section 4.1; STA-1371.
 */
import { CalendarSystem } from "#contracts/enums/calendar-system.enum";
import type { RecurrenceRule } from "#contracts/types/recurrence-rule.type";
import type { RecurrenceWeekday } from "#contracts/types/recurrence-weekday.type";
import { RECURRENCE_WEEKDAYS } from "#core/constants/recurrence-weekdays.constant";

/** The frequencies the editors offer. */
const FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;

/**
 * The integer in `value` when it lies in `[min, max]`.
 * @returns the number, or `undefined` when it is not one or out of range
 */
function intIn(value: string | undefined, min: number, max: number): number | undefined {
  if (value === undefined || !/^-?\d+$/u.test(value)) return undefined;
  const number = Number(value);
  return number >= min && number <= max ? number : undefined;
}

/**
 * Reads `RRULE` text.
 * @param text - the rule, for example `FREQ=MONTHLY;BYDAY=-1FR`
 * @returns the rule, or `undefined` when the text is not one the editors can show
 */
export function parseRrule(text: string): RecurrenceRule | undefined {
  const parts = new Map<string, string>();
  for (const part of text
    .trim()
    .replace(/^RRULE:/iu, "")
    .split(";")) {
    const [key, value] = part.split("=");
    if (key && value) parts.set(key.trim().toUpperCase(), value.trim().toUpperCase());
  }
  const frequency = FREQUENCIES.find((name) => name.toUpperCase() === parts.get("FREQ"));
  if (!frequency) return undefined;
  const scale = parts.get("RSCALE")?.toLowerCase();
  const calendar = CalendarSystem.find((name) => name === scale);
  if (scale && !calendar) return undefined;

  let nth: number | undefined;
  const weekdays: RecurrenceWeekday[] = [];
  for (const day of parts.get("BYDAY")?.split(",") ?? []) {
    const match = /^([+-]?\d)?([A-Z]{2})$/u.exec(day);
    const weekday = RECURRENCE_WEEKDAYS.find((name) => name === match?.[2]);
    if (!match || !weekday) return undefined;
    if (match[1]) {
      nth = intIn(match[1].replace("+", ""), -1, 5);
      if (nth === undefined || nth === 0) return undefined;
    }
    weekdays.push(weekday);
  }

  const read = (key: string, min: number, max: number): number | undefined | null => {
    const value = parts.get(key);
    if (value === undefined) return undefined;
    return intIn(value, min, max) ?? null;
  };
  const interval = read("INTERVAL", 1, 999);
  const monthDay = read("BYMONTHDAY", -1, 31);
  const month = read("BYMONTH", 1, 12);
  const count = read("COUNT", 1, 9999);
  if (interval === null || monthDay === null || monthDay === 0 || month === null || count === null)
    return undefined;
  const untilText = parts.get("UNTIL");
  const day = untilText ? /^(\d{4})(\d{2})(\d{2})/u.exec(untilText) : undefined;
  if (untilText && !day) return undefined;

  return {
    frequency,
    ...(interval === undefined ? {} : { interval }),
    ...(weekdays.length ? { weekdays } : {}),
    ...(nth === undefined ? {} : { nth }),
    ...(monthDay === undefined ? {} : { monthDay }),
    ...(month === undefined ? {} : { month }),
    ...(count === undefined ? {} : { count }),
    ...(day ? { until: `${day[1]}-${day[2]}-${day[3]}` } : {}),
    ...(calendar && calendar !== "gregory" ? { calendar } : {}),
  };
}
