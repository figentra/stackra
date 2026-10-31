/**
 * Stackra file contract:
 * Purpose: `dateLabelOf(input)`, the state, tone and texts of a `DateLabel`, the one rule its web and native sides
 *          follow: a due date is overdue once its day has passed and due soon within `soonDays` (today included); an
 *          expiry is expired or expiring soon the same way; a plain date has no state. Within a week the short text
 *          is relative ("tomorrow"), else the medium date; the full date is in the calendar asked for (Hijri too).
 * Boundary: pure; Intl only. A runtime with no `Intl.RelativeTimeFormat` (older Hermes) writes the date instead. The
 *           texts are written in `numerals` (by default the ones the locale tag's `-u-nu-` keyword names), so the
 *           digits setting holds where the engine ignores the keyword (Hermes on iOS).
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 26 (owner choice "P1 + P2 core", 2026-10-28); ADR 0060.
 */
import type { CalendarSystem } from "#contracts/enums/calendar-system.enum";
import type { DateLabelKind } from "#contracts/enums/date-label-kind.enum";
import type { DateLabelInfo } from "#core/types/date-label-info.type";
import { type NumberingSystem, numeralsOf, withDigits } from "@stackra/i18n";

/** One day in milliseconds. */
// oxlint-disable-next-line stackra/no-literal-duration -- a calendar day, not motion
const DAY_MS = 86_400_000;

/** Within this many days, either way, the short text is relative. */
const RELATIVE_DAYS = 7;

/** Local midnight of a date, so a difference counts calendar days, not 24-hour spans. */
const midnightOf = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * A date format in `calendar`. Hermes on Android refuses a hyphenated `calendar` option ("islamic-umalqura") with a
 * RangeError, so there the calendar rides on the locale's Unicode extension instead.
 */
function dateFormatOf(locale: string, calendar: CalendarSystem, dateStyle: "full" | "medium") {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle, calendar });
  } catch {
    return new Intl.DateTimeFormat(`${locale}-u-ca-${calendar}`, { dateStyle });
  }
}

/**
 * A date label worked out, or `undefined` for an invalid date.
 * @param input - the date, now, the kind, the days that count as soon, the locale, the calendar and whether to be
 *                relative
 * @returns the state, tone, short and full text, ISO string and day difference
 */
export function dateLabelOf(input: {
  readonly date: Date | string;
  readonly now: Date;
  readonly kind: DateLabelKind;
  readonly soonDays: number;
  readonly locale: string;
  readonly calendar: CalendarSystem;
  readonly isRelative: boolean;
  /** The digits of the texts; the locale tag's `-u-nu-` keyword by default. */
  readonly numerals?: NumberingSystem | undefined;
}): DateLabelInfo | undefined {
  const date = typeof input.date === "string" ? new Date(input.date) : input.date;
  if (Number.isNaN(date.getTime())) return undefined;
  // Rounded: a daylight-saving change makes one day 23 or 25 hours long.
  const days = Math.round((midnightOf(date).getTime() - midnightOf(input.now).getTime()) / DAY_MS);
  const isPast = days < 0;
  const isSoon = !isPast && days <= input.soonDays;
  const state =
    input.kind === "due"
      ? isPast
        ? "overdue"
        : isSoon
          ? "due_soon"
          : "none"
      : input.kind === "expiry"
        ? isPast
          ? "expired"
          : isSoon
            ? "expiring_soon"
            : "none"
        : "none";
  const tone = isPast && state !== "none" ? "danger" : state === "none" ? "default" : "warning";
  const { calendar, locale } = input;
  const numerals = input.numerals ?? numeralsOf(locale);
  const full = withDigits(dateFormatOf(locale, calendar, "full").format(date), numerals);
  const medium = withDigits(dateFormatOf(locale, calendar, "medium").format(date), numerals);
  const canRelate =
    input.isRelative &&
    Math.abs(days) < RELATIVE_DAYS &&
    typeof Intl.RelativeTimeFormat === "function";
  const when = canRelate
    ? withDigits(
        new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(days, "day"),
        numerals,
      )
    : medium;
  return { state, tone, when, full, iso: date.toISOString(), days };
}
