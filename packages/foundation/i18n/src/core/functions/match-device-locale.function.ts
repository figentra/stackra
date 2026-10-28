/**
 * Stackra file contract:
 * Purpose: `matchDeviceLocale(tags, locales)`, the shipped locale closest to the phone's preferred languages
 *          (expo-localization's `getLocales()` tags, which on iOS start with the per-app language choice).
 * Boundary: a pure function: walks the phone's tags in order and, per tag, takes the exact shipped locale, then its
 *           base language, then the first shipped locale of the same language; `null` when none matches.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (2026-10-29 note, STA-1534).
 */
import type { Locale } from "#core/enums/locale.enum";

/** The language subtag of a BCP 47 tag, lower case. */
const language = (tag: string): string => (tag.split("-")[0] ?? "").toLowerCase();

/**
 * The shipped locale closest to the phone's languages, or `null`.
 *
 * @example
 * matchDeviceLocale(["ar-EG", "en-GB"], [Locale.En, Locale.Ar, Locale.ArSa]); // "ar"
 * matchDeviceLocale(["en-GB"], [Locale.EnUs]); // "en-US"
 * matchDeviceLocale(["tr-TR"], [Locale.En]); // null
 */
export function matchDeviceLocale(
  tags: readonly string[],
  locales: readonly Locale[],
): Locale | null {
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    const exact = locales.find((locale) => locale.toLowerCase() === lower);
    if (exact !== undefined) return exact;
    const base = language(tag);
    const match =
      locales.find((locale) => locale.toLowerCase() === base) ??
      locales.find((locale) => language(locale) === base);
    if (match !== undefined) return match;
  }
  return null;
}
