/**
 * Stackra file contract:
 * Purpose: `hijriOf`, the Umm al-Qura date of a stored Gregorian date, for showing both side by side and for pack
 *          rules that count in Hijri months.
 * Boundary: pure apart from the runtime's ICU data; throws a `RangeError` for a malformed date and an `Error` when the
 *           runtime has no Umm al-Qura calendar. Formatting for display is `@stackra/i18n`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 2); ADR 0192 (2026-10-24 amendment).
 */
import { dayNumber } from "#core/functions/day-number.function";
import { hijriAt } from "#core/functions/hijri-at.function";
import type { HijriDate } from "#core/types/hijri-date.type";
import type { IsoDate } from "#core/types/iso-date.type";

/**
 * The Umm al-Qura date of `date`.
 *
 * @param date - a Gregorian `YYYY-MM-DD`.
 * @example
 * hijriOf("2025-03-01"); // { year: 1446, month: 9, day: 1 }
 */
export function hijriOf(date: IsoDate): HijriDate {
  return hijriAt(dayNumber(date));
}
