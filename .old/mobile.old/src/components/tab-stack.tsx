import type { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";
import type { ComponentProps } from "react";
import { Platform } from "react-native";

type StackOptions = NonNullable<ComponentProps<typeof Stack>["screenOptions"]>;

/** Header options every tab stack shares: on iOS a transparent large title, so iOS 26 draws the glass scroll edge. */
export function useTabHeaderOptions(): StackOptions {
  const [foreground, background] = useThemeColor(["foreground", "background"]);
  const ios = Platform.OS === "ios";
  return {
    headerLargeTitle: ios,
    headerTransparent: ios,
    headerShadowVisible: false,
    headerLargeTitleShadowVisible: false,
    headerBackButtonDisplayMode: "minimal",
    headerTintColor: foreground,
    headerStyle: ios ? undefined : { backgroundColor: background },
    contentStyle: { backgroundColor: background },
  };
}
