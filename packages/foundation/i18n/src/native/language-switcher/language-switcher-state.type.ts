/**
 * Stackra file contract:
 * Purpose: `LanguageSwitcherState`, what `useLanguageSwitcher()` returns and `<LanguageSwitcher />` hands its child:
 *          the resolved mode, the active and shipped locales, their endonyms, and `choose`.
 * Boundary: type only.
 * Runtime: react-native
 * Governing contract: ADR 0080 (2026-10-29 note, STA-1534).
 */
import type { Locale } from "#core/enums/locale.enum";
import type { NativeSwitcher } from "#core/enums/native-switcher.enum";

/** The native language switcher. */
export interface LanguageSwitcherState {
  /** Who owns the choice on this phone: `system` shows one row that opens Settings, `in_app` lists `locales`. */
  readonly mode: NativeSwitcher;

  /** The active locale. */
  readonly locale: Locale;

  /** The shipped locales (`I18nConfig.locales`), for the `in_app` list. */
  readonly locales: readonly Locale[];

  /** A locale's name in its own language, for a row's label. */
  readonly endonym: (locale: Locale) => string;

  /**
   * Under `system`, opens the phone's language screen for this app (the argument is unused); under `in_app`, switches
   * to `locale` through the provider's `setLocale` (which stores the choice) and, across right-to-left, flips the
   * layout and reloads.
   */
  readonly choose: (locale: Locale) => Promise<void>;
}
