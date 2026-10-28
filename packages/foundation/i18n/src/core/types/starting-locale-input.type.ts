/**
 * Stackra file contract:
 * Purpose: `StartingLocaleInput`, what `startingLocale` decides a native app's first locale from: the shipped locales
 *          and default, `followDevice`, the resolved switcher mode, the phone's language tags and the stored choice.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (2026-10-29 note, STA-1534).
 */
import type { Locale } from "#core/enums/locale.enum";
import type { NativeSwitcher } from "#core/enums/native-switcher.enum";

/** What `startingLocale` decides from. */
export interface StartingLocaleInput {
  /** The shipped locales (`I18nConfig.locales`). */
  readonly locales: readonly Locale[];

  /** The locale nothing else decides (`I18nConfig.defaultLocale`). */
  readonly defaultLocale: Locale;

  /** Whether an `in_app` first launch takes the phone's language (`I18nConfig.followDevice`). */
  readonly followDevice: boolean;

  /** The resolved switcher mode (`nativeSwitcherMode`). */
  readonly mode: NativeSwitcher;

  /** The phone's preferred language tags, nearest first. */
  readonly deviceTags: readonly string[];

  /** The stored choice, or `null` before any. */
  readonly chosen: Locale | null;
}
