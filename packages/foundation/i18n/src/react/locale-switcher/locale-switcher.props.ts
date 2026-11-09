/**
 * Stackra file contract:
 * Purpose: `LocaleSwitcherProps`, what a host hands `<LocaleSwitcher />`: the locales to offer, the label, the
 *          navigation that switches the locale where the URL selects it, and the render function that draws the field.
 * Boundary: type only. The active locale and the setter are the nearest `I18nProvider`'s, never props; the field is the
 *           host's (@stackra/ui's `LocaleSwitcher`), because @stackra/ui sits above this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0080; ADR 0297 (decision 4); ADR 0504 (module UI kits); ADR 0305.
 */
import type { ReactNode } from "react";

import type { Locale } from "#core/enums/locale.enum";
import type { LocaleSwitcherState } from "#react/locale-switcher/locale-switcher-state.type";

/**
 * The switcher's options and the field it draws.
 *
 * @example
 * <LocaleSwitcher label={labels.language} onChange={(locale) => navigate(localeHref(locale))}>
 *   {(switcher) => <UiLocaleSwitcher {...switcher} />}
 * </LocaleSwitcher>
 */
export interface LocaleSwitcherProps {
  /** Draws the field from the bound switcher; spread it onto @stackra/ui's `LocaleSwitcher`. */
  readonly children: (switcher: LocaleSwitcherState) => ReactNode;
  /** The locales offered; defaults to the member's `I18nConfig.locales`. */
  readonly locales?: readonly Locale[] | undefined;
  /** The visible label; left out, @stackra/ui's field uses its own catalogue's "Language". */
  readonly label?: string | undefined;
  /**
   * Switches the locale where the URL selects it (the web): called with the chosen locale instead of the provider's
   * `setLocale`. Left out, the switcher calls `setLocale` (native, the console).
   */
  readonly onChange?: ((locale: Locale) => void) | undefined;
}
