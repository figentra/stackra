/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the public surface of the `./native` entry of @stackra/navigation, the native router
 *          bindings for the Stackra Design System on React Navigation 7: the route overlay and its screen options,
 *          the `Link` seam and the leave confirmation guard. `stackra gen` replaces this file (STA-339).
 * Boundary: re-exports only; no logic. The overlay's own types are in `./contracts`.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15); ADR 0317.
 */
export {
  ReactNavigationProvider,
  type ReactNavigationProviderProps,
} from "#native/react-navigation-provider/react-navigation-provider";
export {
  RouteLeaveConfirmation,
  type RouteLeaveConfirmationProps,
} from "#native/route-leave-confirmation/route-leave-confirmation";
export { RouteOverlay, type RouteOverlayProps } from "#native/route-overlay/route-overlay";
export {
  routeOverlayScreenOptions,
  type RouteOverlayScreenOptionsInput,
} from "#native/route-overlay/route-overlay-screen-options";
export { useRouteOverlay } from "#native/route-overlay/use-route-overlay";
