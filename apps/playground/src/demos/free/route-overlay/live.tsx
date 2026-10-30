/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Route overlay: edit a name and Save, which completes the route; Cancel with unsaved changes asks before it leaves.
 * Boundary: a demo with no props; the in-memory router lives in `workbench/`, so each demo shows one section of it.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0317 (decisions 2 and 9).
 */
import { RouteOverlayWorkbench } from "#src/demos/free/route-overlay/workbench/route-overlay-workbench";

/** Route overlay: Live. */
export default function Live() {
  return <RouteOverlayWorkbench section="live" />;
}
