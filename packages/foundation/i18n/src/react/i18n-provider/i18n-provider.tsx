/**
 * Stackra file contract:
 * Purpose: `I18nProvider`, the React context component the generated `Contexts` of `@stackra/app` mounts with the
 *          active locale and its catalogues, so `useTranslation`, `useLocale`, `useLocaleChoice` and the formatting
 *          hooks read one locale on the server and in the browser or app.
 * Boundary: reads `I18nConfig` from the container of the nearest `ContainerProvider` (`useConfig`), never a static. It
 *           loads nothing: the catalogues arrive merged, and a locale switch is the `setLocale` prop's (absent on the
 *           web, where switching is a navigation).
 * Runtime: isomorphic
 * Governing contract: ADR 0080, ADR 0192, ADR 0295 (decision 7), ADR 0297 (decision 4), ADR 0403 (formats).
 */
import { useConfig } from "@stackra/config/react";
import { type ReactNode, useMemo } from "react";

import { I18nConfig } from "#config/i18n.config";
import { intlLocale } from "#core/functions/intl-locale.function";
import { localeFormat } from "#core/functions/locale-format.function";

import { I18nContext } from "./i18n-context";
import type { I18nProviderProps } from "./i18n-provider-props.type";
import type { I18nState } from "./i18n-state.type";

/** Where no `setLocale` is given, the URL selects the locale. */
const urlSelectsLocale = (): Promise<void> =>
  Promise.reject(
    new Error(
      "This member selects the locale by URL: navigate to the locale's href (useLocaleHref) instead",
    ),
  );

/**
 * Provides the active locale and its catalogues to the tree.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `I18nConfig`.
 * @example
 * <I18nProvider locale={loaderData.locale} messages={loaderData.messages}>
 *   <Outlet />
 * </I18nProvider>
 */
export function I18nProvider({
  locale,
  messages,
  setLocale,
  children,
}: I18nProviderProps): ReactNode {
  const config = useConfig(I18nConfig);
  const state = useMemo<I18nState>(() => {
    const format = localeFormat(locale, config.formats[locale]);
    return {
      locale,
      intlLocale: intlLocale(locale, config.numerals, format.hourCycle),
      format,
      messages,
      config,
      setLocale: setLocale ?? urlSelectsLocale,
    };
  }, [locale, messages, config, setLocale]);
  return <I18nContext value={state}>{children}</I18nContext>;
}
