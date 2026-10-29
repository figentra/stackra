/**
 * Stackra file contract:
 * Purpose: the root component: it boots the app's container behind the splash, then mounts it, the i18n provider (the
 *          phone's language for this app and its region formats), gesture handling, safe-area insets, the Stackra
 *          design system provider (HeroUI Native, colour scheme, direction and the text-size cap) and the navigation
 *          container, with the theme bridged from the Stackra brand colours, around the app lock (off by default).
 *          At launch and on each return to the foreground it re-reads the phone: notification channels, App Tracking
 *          Transparency into consent, the region and, while the phone owns the language, the language. A share from
 *          another app opens the share inbox, whose strings are the packages' catalogues (`boot/app-messages`). The review
 *          area's icon registry is its own (`components/ui/review-icons.tsx`), so a release build drops it.
 * Boundary: composes the providers and the navigator; owns no screen. The language choice is saved to the account's
 *           settings (`account.locale`) through `setLocale`; the container is `boot/create-app-container.function`.
 * Runtime: react-native
 * Governing contract: ADR 0080 (2026-10-29 note); ADR 0302 (2026-10-29 note); ADR 0298; ADR 0255; ADR 0007.
 */
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import type { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import type { PublicId } from "@stackra/contracts";
import {
  I18nConfig,
  localeFormat,
  NativeSwitcher,
  nativeSwitcherMode,
  regionFormat,
  startingLocale,
} from "@stackra/i18n";
import type { Locale } from "@stackra/i18n";
import { deviceLanguageTags, deviceRegion } from "@stackra/i18n/native";
import { I18nProvider } from "@stackra/i18n/react";
import { AppLockGate } from "@stackra/platform/native";
import { SettingValueStore } from "@stackra/settings/contracts";
import { ThemingConfig } from "@stackra/theming";
import { DesignSystemProvider, useDesignSystem } from "@stackra/ui/native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useThemeColor } from "heroui-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { createAppContainer } from "./boot/create-app-container.function";
import { followSystem } from "./boot/follow-system.function";
import { appMessages } from "./boot/app-messages.function";
import { IncomingShareRedirect } from "./boot/incoming-share-redirect";
import { linking } from "./navigation/linking";
import { RootNavigator } from "./navigation/root-navigator";

void SplashScreen.preventAutoHideAsync();

function Navigation() {
  // The scheme on screen, `system` already resolved, and the direction of the locale: the switchers on the
  // design-system screen change both at runtime.
  const { resolvedColorScheme, direction } = useDesignSystem();
  const dark = resolvedColorScheme === "dark";
  const [background, foreground, accent, border] = useThemeColor([
    "background",
    "foreground",
    "accent",
    "border",
  ]);
  const base = dark ? DarkTheme : DefaultTheme;
  const [isReady, setIsReady] = useState(false);
  return (
    <NavigationContainer
      // React Navigation mirrors its headers, back buttons and gestures from this, not from I18nManager alone.
      direction={direction}
      linking={linking}
      onReady={() => {
        setIsReady(true);
        void SplashScreen.hideAsync();
      }}
      theme={{
        ...base,
        colors: {
          ...base.colors,
          background,
          card: background,
          text: foreground,
          primary: accent,
          border,
        },
      }}
    >
      {/* Follows the in-app scheme, not only the device's, so the switcher keeps the status bar readable. */}
      <StatusBar style={dark ? "light" : "dark"} />
      {/* shortcut: no session or catalogues yet, so no role and the English of `platform::app_lock.*`. */}
      <AppLockGate
        roleName={null}
        reason="Unlock to continue"
        unlockLabel="Unlock"
        coverColor={background}
        textColor={foreground}
      >
        <RootNavigator />
      </AppLockGate>
      {/* Mounted once the navigator is ready, so a share that is already waiting opens the inbox. */}
      {isReady ? <IncomingShareRedirect /> : null}
    </NavigationContainer>
  );
}

// shortcut: the app signs no one in yet, so no account holds the choice; return identity's `useSession()` user here
// once the app mounts the session, and the write reaches the server's store.
const accountUser = (): PublicId<"usr"> | null => null;

/** Who owns the language on this phone: the phone (`system`), or the app below Android 13. */
const switcherOf = (config: I18nConfig) =>
  nativeSwitcherMode(config.nativeSwitcher, Platform.OS, Platform.Version);

/** The locale the app starts in: the phone's language for this app, matched to the shipped locales. */
const phoneLocale = (config: I18nConfig): Locale =>
  startingLocale({
    locales: config.locales,
    defaultLocale: config.defaultLocale,
    followDevice: config.followDevice,
    mode: switcherOf(config),
    // On iOS the phone's per-app language leads the list.
    deviceTags: deviceLanguageTags(),
    chosen: null,
  });

/** The booted app: the phone's language and region, re-read on each return to the foreground. */
function Localized({ container }: { container: Container }) {
  const config = container.get(I18nConfig);
  const { maxFontScale } = container.get(ThemingConfig);
  const [locale, setActiveLocale] = useState(() => phoneLocale(config));
  const [device, setDevice] = useState(() => deviceRegion());

  useEffect(() => {
    void followSystem(container);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void followSystem(container);
      setDevice(deviceRegion());
      if (switcherOf(config) === NativeSwitcher.System) setActiveLocale(phoneLocale(config));
    });
    return () => subscription.remove();
  }, [container, config]);

  // Saves the choice to the account, so emails, notifications, the web and other devices use it too.
  const setLocale = useCallback(
    async (next: Locale) => {
      setActiveLocale(next);
      const user = accountUser();
      if (user !== null)
        await container.get(SettingValueStore).write("account", { user }, { locale: next });
    },
    [container],
  );

  const region = useMemo(
    () => regionFormat(device, localeFormat(locale, config.formats[locale])),
    [device, locale, config],
  );

  return (
    <I18nProvider
      locale={locale}
      messages={appMessages(locale)}
      setLocale={setLocale}
      region={region}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <DesignSystemProvider
            locale={locale}
            onLocaleChange={(next) => void setLocale(next as Locale)}
            maxFontScale={maxFontScale}
          >
            <Navigation />
          </DesignSystemProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </I18nProvider>
  );
}

/** The app's root: boots the container behind the splash, then mounts it and the localized app. */
export function App() {
  const [container, setContainer] = useState<Container | Error>();

  useEffect(() => {
    createAppContainer().then(setContainer, (error: unknown) =>
      setContainer(error instanceof Error ? error : new Error(String(error))),
    );
  }, []);

  if (container instanceof Error) throw container;
  // The splash stays up until the navigation container is ready.
  if (container === undefined) return null;
  return (
    <ContainerProvider container={container}>
      <Localized container={container} />
    </ContainerProvider>
  );
}
