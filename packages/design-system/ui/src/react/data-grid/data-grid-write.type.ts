/**
 * Stackra file contract:
 * Purpose: `DataGridWrite`, one cell write a DataGrid runtime asks `useDataGridModel().write` for.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid).
 */
import type { DataGridColumn } from "#contracts/types/data-grid-column.type";
import type { DataGridRow } from "#contracts/types/data-grid-row.type";
import type { DataGridValue } from "#contracts/types/data-grid-value.type";

/** One write a runtime asks for: a cell and its new value. */
export interface DataGridWrite {
  /** The row. */
  readonly row: DataGridRow;
  /** The column. */
  readonly column: DataGridColumn;
  /** The new value. */
  readonly value: DataGridValue;
}
