/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the public surface of the `./react` entry of @stackra/navigation, the web router bindings
 *          for the Stackra Design System on React Router 7: the route overlay, the `Link` seam and the leave
 *          confirmation blocker. `stackra gen` replaces this file (STA-339).
 * Boundary: re-exports only; no logic. The overlay's own types are in `./contracts`.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); ADR 0314.
 */
export {
  ReactRouterProvider,
  type ReactRouterProviderProps,
} from "#react/react-router-provider/react-router-provider";
export {
  RouteLeaveConfirmation,
  type RouteLeaveConfirmationProps,
} from "#react/route-leave-confirmation/route-leave-confirmation";
export { RouteOverlay, type RouteOverlayProps } from "#react/route-overlay/route-overlay";
export { useRouteOverlay } from "#react/route-overlay/use-route-overlay";
