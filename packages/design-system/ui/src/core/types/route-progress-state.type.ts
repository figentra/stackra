/**
 * Stackra file contract:
 * Purpose: `RouteProgressState`, what `useRouteProgress` hands the web and native bar: the fill and whether to draw.
 * Boundary: types only; internal.
 * Runtime: isomorphic
 * Governing contract: gap inventory row 29 (owner approval 2026-10-28); ADR 0305 (one declaration per file).
 */

/** The bar's fill (0 to 1) and whether it is drawn at all (it stays while it fades out). */
export interface RouteProgressState {
  readonly value: number;
  readonly isVisible: boolean;
}
