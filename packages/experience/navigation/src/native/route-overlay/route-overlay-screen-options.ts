/**
 * Stackra file contract:
 * Purpose: `routeOverlayScreenOptions()`, the native stack options that turn a screen into the overlay a presentation
 *          names: `modal` is the platform's modal card, `full-screen` a full-screen modal, and `sheet` and `drawer`
 *          a transparent modal that the screen's `RouteOverlay` fills with `@stackra/ui`'s inset bottom sheet. The app
 *          passes the result as the screen's `options`, because a stack reads its presentation before the screen
 *          mounts and cannot change it afterwards.
 * Boundary: a pure function returning plain options; the header is hidden (the overlay draws its own title and close
 *           button). A native side drawer does not exist on phones, so `drawer` is a sheet here, as `Drawer` is.
 * Runtime: react-native
 * Governing contract: ADR 0317 (decisions 8 and 9); the React Navigation 7 native stack `presentation` option.
 */
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

import type { OverlayPresentation } from "#contracts/enums/overlay-presentation.enum";
import type { RouteOverlayScreenOptionsInput } from "#native/route-overlay/route-overlay-screen-options-input.type";

/**
 * The stack screen options for a route overlay of the given presentation.
 * @param presentation how the overlay is drawn
 * @param input whether the swipe-down dismissal is on
 */
export function routeOverlayScreenOptions(
  presentation: OverlayPresentation,
  { isDismissable = true }: RouteOverlayScreenOptionsInput = {},
): NativeStackNavigationOptions {
  switch (presentation) {
    case "modal":
      return { presentation: "modal", headerShown: false, gestureEnabled: isDismissable };
    case "full-screen":
      return { presentation: "fullScreenModal", headerShown: false, gestureEnabled: isDismissable };
    case "sheet":
    case "drawer":
      // The sheet owns the pan gesture and the scrim, so the stack's own swipe is off and the screen is see-through.
      return {
        presentation: "transparentModal",
        animation: "fade",
        headerShown: false,
        gestureEnabled: false,
        contentStyle: { backgroundColor: "transparent" },
      };
  }
}
