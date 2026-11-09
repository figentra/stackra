/**
 * Stackra file contract:
 * Purpose: `dateTimeFormatIn(tag, options, numerals, calendar)`, the one date and time formatter of Stackra:
 *          Intl.DateTimeFormat in `tag` and `calendar` (Gregorian by default, or the tenant's `DisplaySettings`
 *          choice), its digits written in `numerals` (by default the tag's own `-u-nu-` keyword),
 *          so the configured digits show on every engine, Hermes on iOS included. It has `Intl.DateTimeFormat`'s
 *          `format`, so a library that takes a formatter takes it as is.
 * Boundary: pure apart from Intl. Only digits and the calendar change: a date's separators are the locale's (a German
 *           `28.10.2026` keeps its dots). An explicit `options.calendar` wins over `calendar`.
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decision 2, as amended 2026-10-28; decision 3: Gregorian by default).
 */
import { CalendarSystem } from "#core/enums/calendar-system.enum";
import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { numeralsOf } from "#core/functions/numerals-of.function";
import { withDigits } from "#core/functions/with-digits.function";
import type { DateTimeFormatIn } from "#core/types/date-time-format-in.type";

/** Intl's formatter asked for `numerals` by option too, where the engine reads it; else the tag alone. */
function intlFormat(
  tag: string,
  given: Intl.DateTimeFormatOptions | undefined,
  numerals: NumberingSystem,
  calendar: CalendarSystem,
) {
  const options = calendar === CalendarSystem.Gregory ? given : { calendar, ...given };
  if (numerals === NumberingSystem.User) return new Intl.DateTimeFormat(tag, options);
  try {
    return new Intl.DateTimeFormat(tag, { ...options, numberingSystem: numerals });
  } catch {
    return new Intl.DateTimeFormat(tag, options);
  }
}

/**
 * A date and time formatter of `tag` writing `numerals`, in `calendar`.
 *
 * @example
 * dateTimeFormatIn("ar-u-nu-arab", { year: "numeric" }).format(new Date(2026, 9, 28)); // "٢٠٢٦"
 * dateTimeFormatIn("en", { dateStyle: "long", timeZone: "UTC" }, NumberingSystem.Latn, CalendarSystem.IslamicUmalqura)
 *   .format(new Date("2026-02-18T12:00:00Z")); // "Ramadan 1, 1447 AH"
 */
export function dateTimeFormatIn(
  tag: string,
  options?: Intl.DateTimeFormatOptions,
  numerals: NumberingSystem = numeralsOf(tag),
  calendar: CalendarSystem = CalendarSystem.Gregory,
): DateTimeFormatIn {
  const format = intlFormat(tag, options, numerals, calendar);
  return { format: (value) => withDigits(format.format(value), numerals) };
}
