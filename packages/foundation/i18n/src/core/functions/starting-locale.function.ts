/**
 * Stackra file contract:
 * Purpose: `startingLocale(...)`, the locale a native app starts in: under `system` the phone's per-app language,
 *          under `in_app` the stored choice, then (with `followDevice`) the phone's languages, then the default.
 * Boundary: a pure function over the resolved switcher mode (`nativeSwitcherMode`), the phone's language tags
 *           (expo-localization `getLocales()`), and the stored choice (the account's language setting or the app's
 *           own store). Under `system` the phone's choice always applies, whatever `followDevice` says: the OS screen
 *           is the switcher there, so ignoring it would make the row do nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (2026-10-29 note, STA-1534).
 */
import { NativeSwitcher } from "#core/enums/native-switcher.enum";
import type { Locale } from "#core/enums/locale.enum";
import { matchDeviceLocale } from "#core/functions/match-device-locale.function";
import type { StartingLocaleInput } from "#core/types/starting-locale-input.type";

/**
 * The locale a native app starts in.
 *
 * @example
 * startingLocale({ locales: [Locale.En, Locale.Ar], defaultLocale: Locale.En, followDevice: false,
 *   mode: NativeSwitcher.System, deviceTags: ["ar-SA"], chosen: null }); // "ar"
 */
export function startingLocale(input: StartingLocaleInput): Locale {
  const { locales, defaultLocale, followDevice, mode, deviceTags, chosen } = input;
  const device = () => matchDeviceLocale(deviceTags, locales);
  if (mode === NativeSwitcher.System) return device() ?? defaultLocale;
  const stored = chosen !== null && locales.includes(chosen) ? chosen : null;
  return stored ?? (followDevice ? device() : null) ?? defaultLocale;
}
