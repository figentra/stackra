/**
 * Stackra file contract:
 * Purpose: `RouteOverlayStackContext`, the route overlays open under the current one on web, outermost first. A
 *          route overlay rendered inside another's page (a child route of the overlay's route) reads it to know its
 *          depth and to draw the breadcrumb back to the layers under it.
 * Boundary: the context only; `RouteOverlay` provides it.
 * Runtime: browser
 * Governing contract: ADR 0317 amendment 2026-10-28 (stacked overlays).
 */
import { createContext } from "react";

import type { RouteOverlayLayer } from "#react/route-overlay/route-overlay-layer.type";

/** The overlays under the current one; empty at the page. */
export const RouteOverlayStackContext = createContext<readonly RouteOverlayLayer[]>([]);
