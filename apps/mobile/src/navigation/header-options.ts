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
const liquidGlass = ios && Number.parseInt(String(Platform.Version), 10) >= 26;

/**
 * Native-stack header every stack shares: transparent on iOS. iOS 26 draws the Liquid Glass scroll edge, `hard` so
 * text scrolled under the title is hidden rather than faded (`soft` left it readable behind the title); earlier iOS
 * has no scroll edge and gets the system chrome blur instead, or content would show through.
 */
export const glassHeader: NativeStackNavigationOptions = {
  headerTransparent: ios,
  headerShadowVisible: false,
  headerBackButtonDisplayMode: "minimal",
  ...(liquidGlass ? ({ scrollEdgeEffects: { top: "hard" } } as const) : {}),
  ...(ios && !liquidGlass ? ({ headerBlurEffect: "systemChromeMaterial" } as const) : {}),
};
