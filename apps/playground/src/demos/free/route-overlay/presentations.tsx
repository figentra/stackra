/**
 * Stackra file contract:
 * Purpose: the "presentations" demo of the web Route overlay: each button navigates to a child route that draws the overlay one way; closing returns focus to the button.
 * Boundary: a demo with no props; the in-memory router lives in `workbench/`, so each demo shows one section of it.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0317 (decisions 2 and 9).
 */
import { RouteOverlayWorkbench } from "#src/demos/free/route-overlay/workbench/route-overlay-workbench";

/** Route overlay: Presentations. */
export default function Presentations() {
  return <RouteOverlayWorkbench section="presentations" />;
}
