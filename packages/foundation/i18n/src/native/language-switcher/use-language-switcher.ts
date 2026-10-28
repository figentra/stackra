/**
 * Stackra file contract:
 * Purpose: `useLanguageSwitcher()`, the native language row's state and action in both modes: `system` opens the
 *          phone's per-app language screen, `in_app` switches in place and reloads across right-to-left.
 * Boundary: reads the nearest `I18nProvider`; the mode is `I18nConfig.nativeSwitcher` through `nativeSwitcherMode`
 *           (Android below 13 is `in_app`). Storing the choice (the account's language setting, so emails,
 *           notifications and the web follow it) is the provider's `setLocale`, which the app wires. Android opens
 *           `APP_LOCALE_SETTINGS` for this app's package through expo-intent-launcher; iOS opens the app's settings
 *           page. The reload defaults to expo-updates' `reloadAsync`; a test passes its own.
 * Runtime: react-native
 * Governing contract: ADR 0080 (2026-10-29 note, STA-1534), ADR 0478 (Expo libraries, no hand-written native code).
 */
import { useMemo } from "react";
import Constants from "expo-constants";
import { startActivityAsync } from "expo-intent-launcher";
import { reloadAsync } from "expo-updates";
import { I18nManager, Linking, Platform } from "react-native";

import { NativeSwitcher } from "#core/enums/native-switcher.enum";
import { nativeSwitcherMode } from "#core/functions/native-switcher-mode.function";
import { useI18nState } from "#react/i18n-provider/use-i18n-state";
import { useLocale } from "#react/locale/use-locale";
import type { LanguageSwitcherOptions } from "./language-switcher-options.type";
import type { LanguageSwitcherState } from "./language-switcher-state.type";

/** Opens the phone's language screen for this app: Android's per-app language page, else the app's settings page. */
async function openLanguageSettings(): Promise<void> {
  const androidPackage = Constants.expoConfig?.android?.package;
  if (Platform.OS !== "android" || androidPackage === undefined) return Linking.openSettings();
  await startActivityAsync("android.settings.APP_LOCALE_SETTINGS", {
    data: `package:${androidPackage}`,
  });
}

/**
 * The native language switcher.
 *
 * @throws Error outside an `I18nProvider`.
 * @example
 * const switcher = useLanguageSwitcher();
 * <Row label={switcher.endonym(switcher.locale)} onPress={() => switcher.choose(switcher.locale)} />
 */
export function useLanguageSwitcher(options: LanguageSwitcherOptions = {}): LanguageSwitcherState {
  const { config } = useI18nState();
  const { locale, endonym, setLocale } = useLocale();
  const { reload = reloadAsync } = options;
  const mode = nativeSwitcherMode(config.nativeSwitcher, Platform.OS, Platform.Version);
  return useMemo<LanguageSwitcherState>(
    () => ({
      mode,
      locale,
      locales: config.locales,
      endonym,
      choose: async (next) => {
        if (mode === NativeSwitcher.System) return openLanguageSettings();
        if (next === locale) return;
        await setLocale(next);
        const rtl = config.rtl.includes(next);
        if (rtl === I18nManager.isRTL) return;
        I18nManager.allowRTL(rtl);
        I18nManager.forceRTL(rtl);
        await reload();
      },
    }),
    [mode, locale, config, endonym, setLocale, reload],
  );
}
