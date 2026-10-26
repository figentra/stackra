/**
 * Stackra file contract:
 * Purpose: `RouteOverlayScreenOptionsInput`, what `routeOverlayScreenOptions` may be told besides the presentation.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0317 (decisions 8 and 9).
 */

/** What `routeOverlayScreenOptions` may be told besides the presentation. */
export interface RouteOverlayScreenOptionsInput {
  /** False to turn off the swipe-down that dismisses a `modal` or `full-screen` overlay. Defaults to true. */
  readonly isDismissable?: boolean | undefined;
}
