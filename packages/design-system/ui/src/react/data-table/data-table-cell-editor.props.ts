/**
 * Stackra file contract:
 * Purpose: `DataTableCellEditorProps`, the props of the DataTable's inline cell editor.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); data-collection plan (owner, 2026-10-29), wave 3 (inline edit).
 */
import type { DataGridColumn } from "#contracts/types/data-grid-column.type";
import type { DataGridRow } from "#contracts/types/data-grid-row.type";
import type { DataGridValue } from "#contracts/types/data-grid-value.type";

/** Props of the DataTable's inline cell editor. */
export interface DataTableCellEditorProps {
  /** The cell's typed column: its kind picks the DataGrid editor, its rules validate the value. */
  readonly column: DataGridColumn;
  /** The row, read by the column's own rule. */
  readonly row: DataGridRow;
  /** The cell drawn under the editor; the editor covers its box. */
  readonly anchor: HTMLElement;
  /** The input's accessible name: the column and the row. */
  readonly label: string;
  /** The locale the limits of an error are written in. */
  readonly locale: string;
  /** Called with a valid value; the editor closes. */
  readonly onCommit: (value: DataGridValue) => void;
  /** Called when the edit is dropped (Escape). */
  readonly onCancel: () => void;
}
