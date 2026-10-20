import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Platform } from "react-native";

const ios = Platform.OS === "ios";

/** Native-stack header every stack shares: transparent on iOS, so iOS 26 draws the Liquid Glass scroll edge. */
export const glassHeader: NativeStackNavigationOptions = {
  headerTransparent: ios,
  headerShadowVisible: false,
  headerBackButtonDisplayMode: "minimal",
};

/** Tab roots add a large title that collapses into the glass header on scroll. */
export const largeTitleHeader: NativeStackNavigationOptions = {
  ...glassHeader,
  headerLargeTitle: ios,
  headerLargeTitleShadowVisible: false,
};
