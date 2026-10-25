/**
 * Stackra file contract:
 * Purpose: `localeOfPath(pathname, i18n)`, the locale mount a path belongs to: the shipped locale whose lowercase tag is
 *          its first segment (`/ar-sa/pricing` is `ar-SA`), else the default locale.
 * Boundary: internal; depends on the URL alone, never on a cookie or a header (ADR 0297). React Router's `.data`
 *           suffix is ignored.
 * Runtime: isomorphic
 * Governing contract: ADR 0297 (decision 4).
 */
import type { I18nConfig, Locale } from "@stackra/i18n";

/**
 * The locale of the mount `pathname` is under.
 *
 * @example
 * localeOfPath("/ar-sa/pricing", i18n); // "ar-SA"
 */
export function localeOfPath(
  pathname: string,
  i18n: Pick<I18nConfig, "locales" | "defaultLocale">,
): Locale {
  const first =
    pathname
      .replace(/\.data$/, "")
      .split("/")[1]
      ?.toLowerCase() ?? "";
  return i18n.locales.find((locale) => locale.toLowerCase() === first) ?? i18n.defaultLocale;
}
