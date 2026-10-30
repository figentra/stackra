/**
 * Stackra file contract:
 * Purpose: `dateTimeFormatIn(tag, options, numerals)`, the one date and time formatter of Stackra:
 *          Intl.DateTimeFormat in `tag`, its digits written in `numerals` (by default the tag's own `-u-nu-` keyword),
 *          so the configured digits show on every engine, Hermes on iOS included. It has `Intl.DateTimeFormat`'s
 *          `format`, so a library that takes a formatter takes it as is.
 * Boundary: pure apart from Intl. Only digits change: a date's separators are the locale's (a German `28.10.2026`
 *           keeps its dots).
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decision 2, as amended 2026-10-28; decision 3: Gregorian by default).
 */
import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { numeralsOf } from "#core/functions/numerals-of.function";
import { withDigits } from "#core/functions/with-digits.function";
import type { DateTimeFormatIn } from "#core/types/date-time-format-in.type";

/** Intl's formatter asked for `numerals` by option too, where the engine reads it; else the tag alone. */
function intlFormat(
  tag: string,
  options: Intl.DateTimeFormatOptions | undefined,
  numerals: NumberingSystem,
) {
  if (numerals === NumberingSystem.User) return new Intl.DateTimeFormat(tag, options);
  try {
    return new Intl.DateTimeFormat(tag, { ...options, numberingSystem: numerals });
  } catch {
    return new Intl.DateTimeFormat(tag, options);
  }
}

/**
 * A date and time formatter of `tag` writing `numerals`.
 *
 * @example
 * dateTimeFormatIn("ar-u-nu-arab", { year: "numeric" }).format(new Date(2026, 9, 28)); // "٢٠٢٦"
 */
export function dateTimeFormatIn(
  tag: string,
  options?: Intl.DateTimeFormatOptions,
  numerals: NumberingSystem = numeralsOf(tag),
): DateTimeFormatIn {
  const format = intlFormat(tag, options, numerals);
  return { format: (value) => withDigits(format.format(value), numerals) };
}
