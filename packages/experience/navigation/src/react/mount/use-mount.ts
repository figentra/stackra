/**
 * Stackra file contract:
 * Purpose: `useMount()`, the locale mount the current page is under (`/ar-sa/...` is `ar-SA`) with the i18n
 *          configuration that names the locales: what every href this entry builds is prefixed with.
 * Boundary: internal; reads the URL and the container's `I18nConfig`, never a cookie (ADR 0297). `undefined` when the
 *           container binds no `I18nConfig`: hrefs then stay unprefixed.
 * Runtime: browser
 * Governing contract: ADR 0297 (decision 4).
 */
import { useContainer } from "@stackra/container/react";
import { I18nConfig, type Locale } from "@stackra/i18n";
import { useMemo } from "react";
import { useLocation } from "react-router";

import { localeOfPath } from "#core/functions/locale-of-path.function";

/**
 * The current locale mount.
 *
 * @throws Error outside a `ContainerProvider` or a router.
 * @example
 * const { locale, i18n } = useMount();
 */
export function useMount(): { readonly locale: Locale; readonly i18n: I18nConfig } | undefined {
  const container = useContainer();
  const i18n = container.has(I18nConfig) ? container.get(I18nConfig) : undefined;
  const { pathname } = useLocation();
  return useMemo(
    () => (i18n === undefined ? undefined : { locale: localeOfPath(pathname, i18n), i18n }),
    [pathname, i18n],
  );
}
