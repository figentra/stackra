/**
 * Stackra file contract:
 * Purpose: `DataGridOption`, one choice of a `select` column: the id the cell stores and the label it shows.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid).
 */

/** One choice of a select column. */
export interface DataGridOption {
  /** What the cell stores. */
  readonly id: string;
  /** What the cell shows, and what a pasted value may match as well as the id. */
  readonly label: string;
}
