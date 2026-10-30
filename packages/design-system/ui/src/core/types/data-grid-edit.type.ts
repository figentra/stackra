/**
 * Stackra file contract:
 * Purpose: `DataGridEdit`, one cell write the DataGrid history records: the cell, its new value and its saved value
 *          (so writing the saved value back drops the change).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid undo and redo).
 */
import type { DataGridValue } from "#contracts/types/data-grid-value.type";

/** One cell write. */
export interface DataGridEdit {
  /** The row's id. */
  readonly rowId: string;
  /** The column's id. */
  readonly columnId: string;
  /** The new value. */
  readonly value: DataGridValue;
  /** The saved value of the cell. */
  readonly original: DataGridValue | undefined;
}
