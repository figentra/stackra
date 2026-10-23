/**
 * Stackra file contract:
 * Purpose: the root component: gesture handling, safe-area insets, the Stackra design system provider (HeroUI
 *          Native, colour scheme and direction) and the navigation container, with the theme bridged from the
 *          Stackra brand colours.
 * Boundary: composes the providers and the navigator; owns no screen and no data.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation).
 */
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { DesignSystemProvider, useDesignSystem } from "@stackra/ui/native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useThemeColor } from "heroui-native";
import { useLayoutEffect } from "react";
import { Appearance } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { linking } from "./navigation/linking";
import { RootNavigator } from "./navigation/root-navigator";

void SplashScreen.preventAutoHideAsync();

function Navigation() {
  // The scheme on screen, `system` already resolved: the picker on the design-system screen changes it at runtime.
  const { colorScheme, resolvedColorScheme } = useDesignSystem();
  const dark = resolvedColorScheme === "dark";
  // Native chrome (headers, tab bar, Liquid Glass, system sheets) follows UIKit's interface style, not the theme, so
  // the app's own choice overrides it; `system` hands it back to the device.
  // shortcut: lives in the app until @stackra/ui's native DesignSystemProvider applies it itself; then delete it here.
  useLayoutEffect(() => {
    Appearance.setColorScheme(colorScheme === "system" ? "unspecified" : colorScheme);
  }, [colorScheme]);
  const [background, foreground, accent, border] = useThemeColor([
    "background",
    "foreground",
    "accent",
    "border",
  ]);
  const base = dark ? DarkTheme : DefaultTheme;
  return (
    <NavigationContainer
      linking={linking}
      onReady={() => void SplashScreen.hideAsync()}
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
      <RootNavigator />
    </NavigationContainer>
  );
}

/** The app's root: gestures, safe-area insets, the design system provider, then the navigation container. */
export function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DesignSystemProvider>
          <Navigation />
        </DesignSystemProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
