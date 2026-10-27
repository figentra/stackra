/**
 * Stackra file contract:
 * Purpose: `glassHeader`, the native-stack header options every stack shares: a transparent header on iOS; the base
 *          of `largeTitleHeader` (tab roots) and `detailHeader` (pushed pages).
 * Boundary: option objects only; it declares no navigator and no screen.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation).
 */
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Platform } from "react-native";

const ios = Platform.OS === "ios";

/** Native-stack header every stack shares: transparent on iOS, so iOS 26 draws the Liquid Glass scroll edge. */
export const glassHeader: NativeStackNavigationOptions = {
  headerTransparent: ios,
  headerShadowVisible: false,
  headerBackButtonDisplayMode: "minimal",
};
