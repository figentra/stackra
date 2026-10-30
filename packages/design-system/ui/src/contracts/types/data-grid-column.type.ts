/**
 * Stackra file contract:
 * Purpose: `DataGridColumn`, one column of a DataGrid: its key and header, the kind of value it holds, the rules a
 *          value must meet (required, a number range, the app's own check), whether it can be edited, its width and
 *          its alignment.
 * Boundary: types only. `validate` returns the app's own message in the active locale, or undefined when the value
 *           is fine; the grid adds the required, range and type checks itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid); WCAG 2.2 SC 3.3.1.
 */
import type { DataGridCellType } from "#contracts/enums/data-grid-cell-type.enum";
import type { TextAlign } from "#contracts/enums/text-align.enum";
import type { DataGridOption } from "#contracts/types/data-grid-option.type";
import type { DataGridRow } from "#contracts/types/data-grid-row.type";
import type { DataGridValue } from "#contracts/types/data-grid-value.type";

/** One column of a DataGrid. */
export interface DataGridColumn {
  /** The column's key: the property of each row it shows and the key of its changes. */
  readonly id: string;
  /** The header text; the column's accessible name. */
  readonly label: string;
  /** The kind of value. Defaults to `text`. */
  readonly type?: DataGridCellType | undefined;
  /** The choices of a `select` column. */
  readonly options?: readonly DataGridOption[] | undefined;
  /** True when an empty cell is an error. */
  readonly isRequired?: boolean | undefined;
  /** The least value of a `number` column. */
  readonly min?: number | undefined;
  /** The greatest value of a `number` column. */
  readonly max?: number | undefined;
  /** True to refuse edits in this column; the first column of a matrix is always read-only. */
  readonly isReadOnly?: boolean | undefined;
  /** The width on web, in CSS pixels. Defaults to 160 (96 for numbers and booleans). */
  readonly width?: number | undefined;
  /** How the cell's text lines up. Defaults to `end` for numbers and `start` otherwise. */
  readonly align?: TextAlign | undefined;
  /** The app's own rule: a message in the active locale for a bad value, or undefined. */
  readonly validate?: ((value: DataGridValue, row: DataGridRow) => string | undefined) | undefined;
}
