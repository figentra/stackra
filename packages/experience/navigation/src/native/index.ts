/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/navigation (the React Navigation adapters: `toScreen` and
 *          `useLayoutLoader` for the generated navigation tree, the native `useNavigate`, `useRouteReload`, and the
 *          `ContextMenu` a menu class is bound to a value with) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` internals one way; nothing here touches the DOM or
 *           React Router. `RouteProps` is exported from `.` only (registry A3).
 * Runtime: react-native
 * Governing contract: ADR 0317 (route overlay); ADR 0294 (decision 15); ADR 0165 (React Navigation; expo-router rejected); the STA-347 stand-in
 *                     barrel decision.
 */
export { ContextMenu } from "#native/context-menu/context-menu";
export type { ContextMenuProps } from "#native/context-menu/context-menu.props";
export type { LayoutLoaderState } from "#native/layout-loader/layout-loader-state.type";
export { useLayoutLoader } from "#native/layout-loader/use-layout-loader";
export type { NativeNavigate } from "#native/navigate/native-navigate.type";
export { useNavigate } from "#native/navigate/use-navigate";
export type { RouteReload } from "#native/route-reload/route-reload.type";
export { useRouteReload } from "#native/route-reload/use-route-reload";
export { toScreen } from "#native/screen/to-screen.function";
export { ReactNavigationProvider } from "#native/react-navigation-provider/react-navigation-provider";
export type { ReactNavigationProviderProps } from "#native/react-navigation-provider/react-navigation-provider.props";
export { RouteLeaveConfirmation } from "#native/route-leave-confirmation/route-leave-confirmation";
export type { RouteLeaveConfirmationProps } from "#native/route-leave-confirmation/route-leave-confirmation.props";
export { RouteOverlay } from "#native/route-overlay/route-overlay";
export type { RouteOverlayProps } from "#native/route-overlay/route-overlay.props";
export { routeOverlayScreenOptions } from "#native/route-overlay/route-overlay-screen-options";
export type { RouteOverlayScreenOptionsInput } from "#native/route-overlay/route-overlay-screen-options-input.type";
export { useRouteOverlay } from "#native/route-overlay/use-route-overlay";
