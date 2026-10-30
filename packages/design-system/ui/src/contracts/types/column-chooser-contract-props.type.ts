/**
 * Stackra file contract:
 * Purpose: the props every runtime's `ColumnChooser` takes: the columns of a table, which of them are hidden, and the
 *          callback that hides or shows one. The app passes the same `hiddenColumns` to its `DataTable`.
 * Boundary: types only; the row-header column cannot be hidden, so a table always names its rows.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); product audit 2026-10-28 (DataTable column chooser).
 */
import type { TableColumn } from "#contracts/types/table-column.type";

/** Props shared by the web and native `ColumnChooser`. */
export interface ColumnChooserContractProps {
  /** The table's columns, in order. */
  readonly columns: readonly TableColumn[];
  /** The ids of the hidden columns. */
  readonly hiddenColumns: readonly string[];
  /** Called with the next hidden ids when a column is hidden or shown. */
  readonly onHiddenColumnsChange: (hiddenColumns: readonly string[]) => void;
  /** The trigger's text and the chooser's name. Defaults to the `ui` catalogue's "Columns". */
  readonly label?: string | undefined;
}
