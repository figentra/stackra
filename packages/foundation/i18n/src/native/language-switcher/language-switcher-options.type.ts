/**
 * Stackra file contract:
 * Purpose: `LanguageSwitcherOptions`, what an app may hand `useLanguageSwitcher()` and `<LanguageSwitcher />`: the
 *          reload that applies an `in_app` change across right-to-left, expo-updates' `reloadAsync` unless replaced.
 * Boundary: type only.
 * Runtime: react-native
 * Governing contract: ADR 0080 (2026-10-29 note, STA-1534), ADR 0478 (Expo libraries).
 */

/** The options of the native language switcher. */
export interface LanguageSwitcherOptions {
  /**
   * Restarts the JavaScript bundle so a direction flip takes effect; defaults to expo-updates' `reloadAsync`. A test
   * passes a recorder here.
   */
  readonly reload?: (() => Promise<void>) | undefined;
}
