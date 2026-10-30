/**
 * Stackra file contract:
 * Purpose: the props every runtime's `RouteProgress` takes: the thin bar across the top of the app while a route loads.
 * Boundary: types only. The router's pending state is the caller's; the bar only trickles forward while it is true.
 * Runtime: isomorphic
 * Governing contract: gap inventory row 29 (owner approval 2026-10-28, P1 + P2 core); ADR 0302 (decision 3).
 */

/** Props shared by the web and native `RouteProgress`. */
export interface RouteProgressContractProps {
  /** True while the next route loads; the bar fills to the end and fades out when it turns false. */
  readonly isLoading: boolean;
  /** The progress bar's accessible name; defaults to "Loading page". */
  readonly label?: string | undefined;
  /** True, the default, to pin the bar to the top of the viewport; false pins it to the nearest positioned parent. */
  readonly isFixed?: boolean | undefined;
}
