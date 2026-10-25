/**
 * Stackra file contract:
 * Purpose: `useLocaleHref()`, the current page's href in another locale mount (`/pricing` ↔ `/ar-sa/pricing`), with
 *          its query and fragment, for a locale switcher or a locale suggestion.
 * Boundary: depends on the URL alone (ADR 0297: never a cookie or a header); the prefix rule is `localePath` of
 *           `@stackra/seo`, so links and the server agree. Without an `I18nConfig` in the container the current href is
 *           returned unchanged.
 * Runtime: browser
 * Governing contract: ADR 0297 (decision 4); ADR 0301 (decision 6).
 */
import { useContainer } from "@stackra/container/react";
import { I18nConfig, type Locale } from "@stackra/i18n";
import { localePath } from "@stackra/seo";
import { useCallback } from "react";
import { useLocation } from "react-router";

/**
 * The current page in another mount.
 *
 * @example
 * hrefFor = useLocaleHref();
 * this.navigate(this.hrefFor("ar-SA")); // "/ar-sa/pricing?interval=year"
 */
export function useLocaleHref(): (locale: Locale) => string {
  const container = useContainer();
  const i18n = container.has(I18nConfig) ? container.get(I18nConfig) : undefined;
  const { pathname, search, hash } = useLocation();
  return useCallback(
    (locale) => {
      const href = `${pathname}${search}${hash}`;
      return i18n === undefined ? href : localePath(href, locale, i18n);
    },
    [pathname, search, hash, i18n],
  );
}
