/**
 * Stackra file contract:
 * Purpose: whether a locale is Arabic, so a native Text picks the theme's `-ar` styles as the web stylesheet does
 *          with `:lang(ar)`.
 * Boundary: pure; reads the language subtag only (no Intl, so it runs on every Hermes build).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 2: the -ar type styles); ADR 0303 (decision 9); ADR 0060 (right-to-left).
 */

/**
 * True when the locale's language is Arabic (`ar`, `ar-EG`, `AR`), the language the theme's `-ar` styles and the
 * web `:lang(ar)` rule cover. Persian, Urdu and Hebrew are false: the styles widen to them when a second
 * Arabic-script locale ships.
 * @param locale - a BCP 47 tag, for example `ar-EG`
 * @returns whether the `-ar` type styles apply
 */
export function isArabic(locale: string): boolean {
  return locale.split("-")[0]?.toLowerCase() === "ar";
}
