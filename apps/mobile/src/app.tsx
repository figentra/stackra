/**
 * Stackra file contract:
 * Purpose: the root component: gesture handling, the HeroUI provider and the navigation container, with the
 *          theme bridged from the Stackra brand colours.
 * Boundary: composes the providers and the navigator; owns no screen and no data.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation).
 */
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider, useThemeColor } from "heroui-native";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { linking } from "./navigation/linking";
import { RootNavigator } from "./navigation/root-navigator";

void SplashScreen.preventAutoHideAsync();

function Navigation() {
  const dark = useColorScheme() === "dark";
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
      <StatusBar />
      <RootNavigator />
    </NavigationContainer>
  );
}

/** The app's root: gesture handling, then the HeroUI provider, then the navigation container. */
export function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <Navigation />
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
