/**
 * Stackra file contract:
 * Purpose: `useRouteOverlay()`, the hook a screen inside a native `RouteOverlay` calls to close the overlay, finish it
 *          after a save, or turn its dismissal on and off while a request runs. The same API as the web hook.
 * Boundary: reads the nearest overlay's context and throws outside one, because a screen that calls it expects an
 *           overlay and silently doing nothing would hide the mistake.
 * Runtime: react-native
 * Governing contract: ADR 0317 (decisions 2 and 9).
 */
import { useContext } from "react";

import type { RouteOverlayControls } from "#contracts/types/route-overlay-controls.type";
import { RouteOverlayContext } from "#native/route-overlay/route-overlay-context";

/**
 * The controls of the route overlay this component sits in.
 * @throws when there is no `RouteOverlay` above the caller
 */
export function useRouteOverlay(): RouteOverlayControls {
  const controls = useContext(RouteOverlayContext);
  if (!controls) throw new Error("useRouteOverlay must be called inside a RouteOverlay.");
  return controls;
}
