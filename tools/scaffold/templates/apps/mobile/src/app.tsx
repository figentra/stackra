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

export function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <Navigation />
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
