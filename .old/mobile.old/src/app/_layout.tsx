import "../global.css";

import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider, useThemeColor } from "heroui-native";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

void SplashScreen.preventAutoHideAsync();

function RootStack() {
  const [foreground, background] = useThemeColor(["foreground", "background"]);
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);
  return (
    <>
      <StatusBar />
      <Stack
        screenOptions={{
          headerShown: false,
          headerTintColor: foreground,
          contentStyle: { backgroundColor: background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <RootStack />
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
