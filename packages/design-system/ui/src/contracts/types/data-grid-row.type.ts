/**
 * Stackra file contract:
 * Purpose: `DataGridRow`, one row of a DataGrid: its `id` and one value per column id.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid).
 */
import type { DataGridValue } from "#contracts/types/data-grid-value.type";

/** One row of a DataGrid. */
export interface DataGridRow {
  /** The row's key, unique within the grid; the changes are keyed by it. */
  readonly id: string;
  /** The row's values, by column id. */
  readonly [columnId: string]: DataGridValue | undefined;
}
