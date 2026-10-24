/**
 * Stackra file contract:
 * Purpose: what `useRouteOverlay()` hands the page inside a route overlay: close it, finish it after a save, and turn
 *          its dismissal on or off while a flow runs.
 * Boundary: types only; each runtime implements the functions with its own router.
 * Runtime: isomorphic
 * Governing contract: ADR 0314 (decisions 2 and 9); ADR 0312.
 */

/** The controls of the route overlay a page sits in. */
export interface RouteOverlayControls {
  /** Closes the overlay and goes back to where the user came from, the way the close button does. */
  readonly close: () => void;
  /**
   * Finishes the overlay after a save: it goes to `to` when given and otherwise back, as `close` does. On web the
   * entry is replaced, so Back does not return to a finished form.
   */
  readonly complete: (to?: string) => void;
  /** Turns the press outside, Escape and swipe dismissal on or off, for example while a request is in flight. */
  readonly setDismissable: (isDismissable: boolean) => void;
  /** Whether the overlay can be dismissed by a press outside, Escape or a swipe right now. */
  readonly isDismissable: boolean;
}
