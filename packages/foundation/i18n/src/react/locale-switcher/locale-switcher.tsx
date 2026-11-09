/**
 * Stackra file contract:
 * Purpose: `<LocaleSwitcher />`, the i18n kit's data-bound locale switcher: it binds @stackra/ui's `LocaleSwitcher`
 *          props to the nearest `I18nProvider` (the offered locales, the active one) and, on a choice, remembers it
 *          (`useLocaleChoice`) and switches, through the host's `onChange` (a navigation on the web) or the provider's
 *          `setLocale`.
 * Boundary: headless: it hands its render function the bound props and draws nothing itself, because @stackra/ui sits
 *           above this package and imports it (the native `LanguageSwitcher` does the same). A refused `setLocale`
 *           sets `hasFailed` and remembers nothing; the host shows its words in a live region. Throws outside an
 *           `I18nProvider`.
 * Runtime: isomorphic
 * Governing contract: ADR 0080; ADR 0297 (decision 4); ADR 0504 (module UI kits); WCAG 2.2 SC 3.1.2 and 4.1.3.
 */
import { type ReactNode, useState } from "react";

import { useI18nState } from "#react/i18n-provider/use-i18n-state";
import { useLocale } from "#react/locale/use-locale";
import { useLocaleChoice } from "#react/locale/use-locale-choice";
import type { LocaleSwitcherProps } from "#react/locale-switcher/locale-switcher.props";

/**
 * Hands its render function the locale switcher, bound to the nearest `I18nProvider`.
 *
 * @throws Error outside an `I18nProvider`.
 * @example
 * <LocaleSwitcher onChange={(locale) => navigate(localeHref(locale))}>
 *   {(switcher) => <UiLocaleSwitcher {...switcher} />}
 * </LocaleSwitcher>
 */
export function LocaleSwitcher({
  children,
  locales,
  label,
  onChange,
}: LocaleSwitcherProps): ReactNode {
  const { config } = useI18nState();
  const { locale, setLocale } = useLocale();
  const { choose } = useLocaleChoice();
  const [hasFailed, setFailed] = useState(false);
  const offered = locales ?? config.locales;

  const change = (tag: string) => {
    const next = offered.find((one) => one === tag);
    if (next === undefined || next === locale) return;
    setFailed(false);
    if (onChange === undefined) {
      setLocale(next).then(
        () => choose(next),
        () => setFailed(true),
      );
      return;
    }
    choose(next);
    onChange(next);
  };

  return children({
    locales: offered,
    value: locale,
    onChange: change,
    hasFailed,
    ...(label === undefined ? {} : { label }),
  });
}
