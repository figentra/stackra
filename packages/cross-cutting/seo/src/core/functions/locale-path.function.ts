/**
 * Stackra file contract:
 * Purpose: `localePath`, a site path in one locale's mount: the default locale unprefixed under
 *          `prefix_except_default` (`/pricing`), every other locale under its lowercase tag (`/ar-sa/pricing`, the
 *          locale root `/ar-sa/`). A path already under a shipped locale's prefix is moved, not prefixed twice.
 * Boundary: an ordinary function, callable from client and server route code (it lives outside every `.server`
 *           module). The query and fragment are kept as they are. It depends on the URL alone, never on a cookie
 *           or a header.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 6); ADR 0297 (decision 4); ADR 0080.
 */
import { LocaleUrlStrategy, type I18nConfig, type Locale } from "@stackra/i18n";

/**
 * `path` in the mount of `locale`.
 *
 * @example
 * localePath("/pricing", Locale.ArSa, i18n); // "/ar-sa/pricing"
 * localePath("/ar-sa/pricing", Locale.En, i18n); // "/pricing"
 * @param i18n - the i18n configuration: the shipped locales, the default and the URL strategy.
 */
export function localePath(
  path: string,
  locale: Locale,
  i18n: Pick<I18nConfig, "locales" | "defaultLocale" | "urlStrategy">,
): string {
  const split = path.search(/[?#]/);
  const pathname = split === -1 ? path : path.slice(0, split);
  const suffix = split === -1 ? "" : path.slice(split);
  const rooted = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const first = rooted.split("/")[1]?.toLowerCase() ?? "";
  const mounted = i18n.locales.some((code) => code.toLowerCase() === first);
  const bare = mounted ? rooted.slice(first.length + 1) || "/" : rooted;
  const unprefixed =
    i18n.urlStrategy === LocaleUrlStrategy.PrefixExceptDefault && locale === i18n.defaultLocale;
  if (unprefixed) return `${bare}${suffix}`;
  return `/${locale.toLowerCase()}${bare === "/" ? "/" : bare}${suffix}`;
}
