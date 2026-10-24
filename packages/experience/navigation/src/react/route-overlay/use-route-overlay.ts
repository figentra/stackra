/**
 * Stackra file contract:
 * Purpose: `useRouteOverlay()`, the hook a page inside a web `RouteOverlay` calls to close the overlay, finish it
 *          after a save, or turn its dismissal on and off while a request runs.
 * Boundary: reads the nearest overlay's context and throws outside one, because a page that calls it expects an
 *           overlay and silently doing nothing would hide the mistake.
 * Runtime: browser
 * Governing contract: ADR 0314 (decisions 2 and 9).
 */
import { useContext } from "react";

import type { RouteOverlayControls } from "#contracts/types/route-overlay-controls.type";
import { RouteOverlayContext } from "#react/route-overlay/route-overlay-context";

/**
 * The controls of the route overlay this component sits in.
 * @throws when there is no `RouteOverlay` above the caller
 */
export function useRouteOverlay(): RouteOverlayControls {
  const controls = useContext(RouteOverlayContext);
  if (!controls) throw new Error("useRouteOverlay must be called inside a RouteOverlay.");
  return controls;
}
