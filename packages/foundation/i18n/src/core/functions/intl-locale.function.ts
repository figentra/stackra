/**
 * Stackra file contract:
 * Purpose: `intlLocale(locale, numerals)`, the locale tag every Intl formatter of this package is built with: the
 *          locale plus the `-u-nu-` extension of the configured digits, so messages, numbers, money and dates share
 *          one digit choice.
 * Boundary: pure; internal to the package (the React provider and its tests use it). `NumberingSystem.User` adds no
 *           extension, so the locale's and the device's own default applies.
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decision 2: digits are the user's choice, Latin by default).
 */
import { NumberingSystem } from "#core/enums/numbering-system.enum";

/**
 * The BCP 47 tag Intl reads for `locale` with `numerals`.
 *
 * @example
 * intlLocale("ar-SA", NumberingSystem.Latn); // "ar-SA-u-nu-latn"
 * intlLocale("ar", NumberingSystem.User); // "ar"
 */
export function intlLocale(locale: string, numerals: NumberingSystem): string {
  return numerals === NumberingSystem.User ? locale : `${locale}-u-nu-${numerals}`;
}
