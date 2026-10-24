/**
 * Stackra file contract:
 * Purpose: the React context the native `RouteOverlay` fills and `useRouteOverlay()` reads: the controls of the
 *          overlay screen a page sits in.
 * Boundary: the context object only; null outside a route overlay.
 * Runtime: react-native
 * Governing contract: ADR 0314 (decision 2).
 */
import { createContext } from "react";

import type { RouteOverlayControls } from "#contracts/types/route-overlay-controls.type";

/** The controls of the nearest `RouteOverlay`, or null when there is none. */
export const RouteOverlayContext = createContext<RouteOverlayControls | null>(null);
