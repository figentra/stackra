/**
 * Stackra file contract:
 * Purpose: `columnChooserOf(columns, hiddenColumns)`, what every runtime's ColumnChooser draws and reports: one
 *          checkbox option per column (the row header's disabled, so a table always names its rows), the ids ticked,
 *          and the hidden ids for a new set of ticked ones.
 * Boundary: pure; the runtimes draw the popover and the checkboxes. The row header is the column marked so, else the
 *           first; it is never reported hidden.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); product audit 2026-10-28 (DataTable column chooser).
 */
import type { TableColumn } from "#contracts/types/table-column.type";

/**
 * The column chooser's options, its ticked ids and the hidden ids of a new choice.
 * @param columns - the table's columns, in order
 * @param hiddenColumns - the ids hidden now
 * @returns the checkbox options, the ids shown and `hiddenOf`, which turns the ticked ids into the hidden ones
 * @example columnChooserOf(columns, ["sku"]).hiddenOf(["name"]); // every id but the row header's and "name"
 */
export function columnChooserOf(
  columns: readonly TableColumn[],
  hiddenColumns: readonly string[],
): {
  readonly options: readonly { value: string; label: string; isDisabled: boolean }[];
  readonly shown: readonly string[];
  readonly hiddenOf: (shown: readonly string[]) => readonly string[];
} {
  const rowHeaderId = (columns.find((column) => column.isRowHeader) ?? columns[0])?.id;
  const ids = columns.map((column) => column.id);
  return {
    options: columns.map((column) => ({
      value: column.id,
      label: column.label,
      isDisabled: column.id === rowHeaderId,
    })),
    shown: ids.filter((id) => !hiddenColumns.includes(id)),
    hiddenOf: (shown) => ids.filter((id) => id !== rowHeaderId && !shown.includes(id)),
  };
}
