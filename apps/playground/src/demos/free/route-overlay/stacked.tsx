/**
 * Stackra file contract:
 * Purpose: the "stacked" demo of the web Route overlay: an order drawer opens its customer in a drawer over it, which
 *          opens the delivery address over that; each layer is a child route and the breadcrumb walks back down.
 * Boundary: a demo with no props; the in-memory router lives in `workbench/`, so each demo shows one section of it.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0317 amendment 2026-10-28
 *          (stacked overlays).
 */
import { RouteOverlayWorkbench } from "#src/demos/free/route-overlay/workbench/route-overlay-workbench";

/** Route overlay: Stacked drawers. */
export default function Stacked() {
  return <RouteOverlayWorkbench section="stacked" />;
}
