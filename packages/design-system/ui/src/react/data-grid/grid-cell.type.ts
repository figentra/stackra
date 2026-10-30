/**
 * Stackra file contract:
 * Purpose: `GridCell`, a cell's place in the web DataGrid: its row and column index among the rows and columns drawn.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid).
 */

/** A cell, by row and column index. */
export interface GridCell {
  /** The row's index in `rows`. */
  readonly row: number;
  /** The column's index in the columns drawn. */
  readonly column: number;
}
