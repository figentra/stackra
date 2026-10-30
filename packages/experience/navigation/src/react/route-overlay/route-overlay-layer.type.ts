/**
 * Stackra file contract:
 * Purpose: `RouteOverlayLayer`, one open route overlay in a stack of them on web: its breadcrumb name and the path
 *          of its route, so a drawer stacked over it can link back to it.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0317 amendment 2026-10-28 (stacked overlays).
 */

/** One open overlay under the current one. */
export interface RouteOverlayLayer {
  /** The overlay's name in the breadcrumb. */
  readonly label: string;
  /** The pathname of the overlay's route. */
  readonly path: string;
}
