/**
 * Stackra file contract:
 * Purpose: `LanguageSwitcherOptions`, what an app hands `useLanguageSwitcher()` and `<LanguageSwitcher />`: the reload
 *          that applies an `in_app` change across right-to-left.
 * Boundary: type only.
 * Runtime: react-native
 * Governing contract: ADR 0080 (2026-10-29 note, STA-1534), ADR 0478 (Expo libraries).
 */

/** The options of the native language switcher. */
export interface LanguageSwitcherOptions {
  /**
   * Restarts the JavaScript bundle so a direction flip takes effect (expo-updates `Updates.reloadAsync`). Without it,
   * an `in_app` change across right-to-left still switches the text at once and flips the layout on the next launch.
   */
  readonly reload?: (() => Promise<void>) | undefined;
}
