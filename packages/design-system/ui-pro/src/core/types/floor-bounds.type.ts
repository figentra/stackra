/**
 * Stackra file contract:
 * Purpose: `FloorBounds`, the grid a floor-plan item must stay inside: the plan's columns and rows.
 * Boundary: internal; a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3).
 */

/** The plan's grid, in cells. */
export interface FloorBounds {
  /** The plan's width, in cells. */
  readonly columns: number;
  /** The plan's height, in cells. */
  readonly rows: number;
}
