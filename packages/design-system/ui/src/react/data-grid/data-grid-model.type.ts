/**
 * Stackra file contract:
 * Purpose: `DataGridModel`, what `useDataGridModel()` hands both runtimes' DataGrid: the columns as drawn, each
 *          cell's current value, text and error, the pending changes with undo and redo, the matrix totals, Save and
 *          Discard, and the words of the save bar.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid).
 */
import type { DataGridChanges } from "#contracts/types/data-grid-changes.type";
import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { DataGridRow } from "#contracts/types/data-grid-row.type";
import type { DataGridValue } from "#contracts/types/data-grid-value.type";
import type { DataGridWrite } from "#react/data-grid/data-grid-write.type";

/** The DataGrid's shared state and words. */
export interface DataGridModel {
  /** The columns as drawn: in a matrix the first is read-only and the rest are numbers of at least 0. */
  readonly columns: readonly CollectionColumn[];
  /** The pending changes. */
  readonly changes: DataGridChanges;
  /** How many cells are edited. */
  readonly changeCount: number;
  /** How many edited cells are invalid. */
  readonly errorCount: number;
  /** The cell's value with its pending change. */
  readonly valueOf: (row: DataGridRow, column: CollectionColumn) => DataGridValue;
  /** The cell's value as text for its locale: a number formatted, an option's label, yes or no, a day. */
  readonly textOf: (value: DataGridValue, column: CollectionColumn) => string;
  /** The cell's value as clipboard text: plain numbers, option labels, TRUE or FALSE, ISO days. */
  readonly copyTextOf: (value: DataGridValue, column: CollectionColumn) => string;
  /** The message of the cell's error, or undefined when it is valid or unchanged. */
  readonly errorOf: (row: DataGridRow, column: CollectionColumn) => string | undefined;
  /** True when the cell was edited. */
  readonly isChanged: (row: DataGridRow, column: CollectionColumn) => boolean;
  /** True when the cell can be edited. */
  readonly isEditable: (column: CollectionColumn) => boolean;
  /** Writes cells as one undo step; read-only cells are skipped. */
  readonly write: (writes: readonly DataGridWrite[]) => void;
  /** Steps back and forward through the edits. */
  readonly undo: () => void;
  /** Steps forward to the edit last undone. */
  readonly redo: () => void;
  /** True when there is an edit to undo. */
  readonly canUndo: boolean;
  /** True when there is an edit to redo. */
  readonly canRedo: boolean;
  /** Saves the changes through `onSave`, then clears them. */
  readonly save: () => Promise<void>;
  /** Drops the changes. */
  readonly discard: () => void;
  /** The total of a matrix row's number cells. */
  readonly rowTotalOf: (row: DataGridRow) => number;
  /** The total of a matrix column over every row. */
  readonly columnTotalOf: (column: CollectionColumn) => number;
  /** The save bar's message: the change count and, when any, the error count. */
  readonly message: string;
}
