/**
 * Stackra file contract:
 * Purpose: the history state an opener may put on the navigation that opens a route overlay on web: `returnTo`, the
 *          place Close and Complete go back to. With it, closing steps Back when the opener pushed the entry and
 *          replaces with `returnTo` after a deep link; without it, closing goes to the parent route.
 * Boundary: types only; the state is plain data and survives a reload.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 (decision 2).
 */

/** The location state a route overlay reads. */
export interface RouteOverlayState {
  /** The path, with its search, that closing returns to. */
  readonly returnTo?: string | undefined;
}
