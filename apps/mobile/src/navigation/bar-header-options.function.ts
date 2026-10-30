/**
 * Stackra file contract:
 * Purpose: `barHeaderOptions(bars, isLargeTitle)`, the native-stack header options that make every header follow
 *          the theme: on iOS, a glass of the theme's own background (`bars.tint`, about 88%) over a system blur of the
 *          content's tone, so the title, the bar buttons and the search field never collide with what scrolls under
 *          them; solid under Reduce Transparency. A large-title stack is clear at the scroll edge and turns to the glass
 *          once content scrolls under it. Any other header wears the glass at the edge too: UIKit tells the scroll edge
 *          only when it tracks the screen's list, which a screen with a layer above its list (an ambient field) breaks,
 *          and over the screen's own background the glass is all but invisible. The title and bar items are the theme's foreground. On Android the header is the theme's
 *          background, opaque, with foreground text.
 * Boundary: option objects only, from `useThemeBars()` (@stackra/ui/native); every stack spreads them over
 *           `glassHeader`, `largeTitleHeader` or `detailHeader`.
 * Runtime: react-native
 * Governing contract: owner decision 2026-10-28 (the status bar and the top bar follow the theme); ADR 0320.
 */
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import type { ThemeBars } from "@stackra/ui/native";
import { Platform } from "react-native";

/** iOS 26 draws a Liquid Glass scroll edge of its own, which the tinted glass replaces (they would overlap). */
const LIQUID_GLASS = Platform.OS === "ios" && Number.parseInt(String(Platform.Version), 10) >= 26;

/** The header options of the theme `bars` describe. */
export function barHeaderOptions(
  bars: ThemeBars,
  isLargeTitle = false,
): NativeStackNavigationOptions {
  const text = { color: bars.foreground };
  if (Platform.OS !== "ios")
    return {
      headerStyle: { backgroundColor: bars.background },
      headerTintColor: bars.foreground,
      headerTitleStyle: text,
    };
  return {
    // Scrolled (the standard appearance): the tinted glass; at the scroll edge, clear under a large title only.
    headerStyle: { backgroundColor: bars.tint },
    headerLargeStyle: { backgroundColor: isLargeTitle ? "transparent" : bars.tint },
    headerBlurEffect: bars.isSolid
      ? "none"
      : bars.content === "light"
        ? "systemThinMaterialDark"
        : "systemThinMaterialLight",
    headerTintColor: bars.foreground,
    headerTitleStyle: text,
    headerLargeTitleStyle: text,
    ...(LIQUID_GLASS ? ({ scrollEdgeEffects: { top: "hidden" } } as const) : {}),
  };
}
