/**
 * Stackra file contract:
 * Purpose: `LocaleSwitcherState`, what `<LocaleSwitcher />` hands its render function: the props @stackra/ui's
 *          `LocaleSwitcher` takes (the locales offered, the active one, the change handler and the label), bound to
 *          the nearest `I18nProvider`, plus whether the last switch failed.
 * Boundary: type only. Structurally the @stackra/ui `LocaleSwitcherContractProps`, so the state spreads straight onto
 *           that component; this package names no @stackra/ui type, because @stackra/ui sits above it.
 * Runtime: isomorphic
 * Governing contract: ADR 0080; ADR 0297 (decision 4); ADR 0504 (module UI kits).
 */
import type { Locale } from "#core/enums/locale.enum";

/** The bound switcher. */
export interface LocaleSwitcherState {
  /** The locales offered: the switcher's `locales`, else the member's `I18nConfig.locales`. */
  readonly locales: readonly Locale[];
  /** The active locale. */
  readonly value: Locale;
  /** Switches to the chosen locale; a tag that is not offered, or the active one, changes nothing. */
  readonly onChange: (locale: string) => void;
  /** The host's label, when it gave one. */
  readonly label?: string | undefined;
  /** True after the provider's `setLocale` refused the last switch, until the next one; the host shows its words. */
  readonly hasFailed: boolean;
}
