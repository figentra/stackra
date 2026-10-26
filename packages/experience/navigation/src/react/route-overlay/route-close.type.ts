/**
 * Stackra file contract:
 * Purpose: `RouteClose`, the two ways out of a web route overlay that `useRouteClose()` returns: close and complete.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0317 (decision 2).
 */

/** The two ways out of a route overlay. */
export interface RouteClose {
  /** Goes back to where the user came from. */
  readonly close: () => void;
  /** Goes to `to` (replacing the entry) when given, and otherwise closes. */
  readonly complete: (to?: string) => void;
}
