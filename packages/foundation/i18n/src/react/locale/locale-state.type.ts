/**
 * Stackra file contract:
 * Purpose: `LocaleState`, what `useLocale()` returns: the active locale, its direction, the endonym lookup and the
 *          setter.
 * Boundary: type only; every member is safe to destructure.
 * Runtime: isomorphic
 * Governing contract: ADR 0080, ADR 0297 (decision 4).
 */
import type { Locale } from "#core/enums/locale.enum";

/** Locale facts of the active locale. */
export interface LocaleState {
  /** The active locale. */
  readonly locale: Locale;

  /** `rtl` when the member's `I18nConfig.rtl` lists the active locale, else `ltr`. */
  readonly direction: "ltr" | "rtl";

  /** A locale's name in its own language (`العربية` for `ar`), for a switcher that every reader recognises. */
  readonly endonym: (locale: Locale) => string;

  /**
   * Switches the active locale where the member stores the choice (native, the console); rejects where the URL alone
   * selects it (the web), which navigates instead.
   */
  readonly setLocale: (locale: Locale) => Promise<void>;
}
