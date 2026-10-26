/**
 * Stackra file contract:
 * Purpose: `intlLocale(locale, numerals, hourCycle)`, the locale tag every Intl formatter of this package is built
 *          with: the locale plus the `-u-` extension of the configured clock (`hc`) and digits (`nu`), so messages,
 *          numbers, money and dates share one digit and clock choice.
 * Boundary: pure; internal to the package (the React provider and its tests use it). `NumberingSystem.User` adds no
 *           `nu`, so the locale's and the device's own default applies; no `hourCycle` adds no `hc`.
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decision 2: digits are the user's choice, Latin by default); ADR 0403 (formats).
 */
import type { HourCycle } from "#core/enums/hour-cycle.enum";
import { NumberingSystem } from "#core/enums/numbering-system.enum";

/**
 * The BCP 47 tag Intl reads for `locale` with `numerals` and `hourCycle`.
 *
 * @example
 * intlLocale("ar-SA", NumberingSystem.Latn); // "ar-SA-u-nu-latn"
 * intlLocale("de", NumberingSystem.Latn, HourCycle.H23); // "de-u-hc-h23-nu-latn"
 * intlLocale("ar", NumberingSystem.User); // "ar"
 */
export function intlLocale(
  locale: string,
  numerals: NumberingSystem,
  hourCycle?: HourCycle,
): string {
  const keywords = [
    ...(hourCycle === undefined ? [] : [`hc-${hourCycle}`]),
    ...(numerals === NumberingSystem.User ? [] : [`nu-${numerals}`]),
  ];
  return keywords.length === 0 ? locale : `${locale}-u-${keywords.join("-")}`;
}
