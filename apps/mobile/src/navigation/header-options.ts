/**
 * Stackra file contract:
 * Purpose: the shared native-stack header options: a transparent header on iOS, and large titles on tab roots.
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

/** Tab roots add a large title that collapses into the glass header on scroll. */
export const largeTitleHeader: NativeStackNavigationOptions = {
  ...glassHeader,
  headerLargeTitle: ios,
  headerLargeTitleShadowVisible: false,
};

/** Pages pushed from a tab root keep the glass header and the small title, so the large title stays on roots. */
export const detailHeader: NativeStackNavigationOptions = {
  ...glassHeader,
  headerLargeTitle: false,
};
