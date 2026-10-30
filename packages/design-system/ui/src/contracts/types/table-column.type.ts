/**
 * Stackra file contract:
 * Purpose: one column of a Table: its key, its header text, whether the header can sort it, and its width, pin and wrap, so both runtimes draw
 *          the same columns from the same data.
 * Boundary: types only. `id` is also the key `renderCell` is asked about and the `column` a `SortDescriptor` holds.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313.
 */
import type { ColumnPin } from "#contracts/enums/column-pin.enum";
import type { TextAlign } from "#contracts/enums/text-align.enum";

/** One column of a Table. */
export interface TableColumn {
  /** The key of the column; unique within the table, and the `column` of the sort when it is sorted. */
  readonly id: string;
  /** The header text; it is the column's accessible name. */
  readonly label: string;
  /** True for the column whose cell names the row to assistive technology; left out, the first column is it. */
  readonly isRowHeader?: boolean | undefined;
  /** True to let a press on the header ask for a sort by this column; the app sorts, never the table. */
  readonly isSortable?: boolean | undefined;
  /** How the column's text lines up. Defaults to `start`. */
  readonly align?: TextAlign | undefined;
  /** The width in CSS pixels. Left out, the column shares the free width; a pinned column needs one to stick. */
  readonly width?: number | undefined;
  /** The narrowest a resize may make the column, in CSS pixels. Defaults to 64. */
  readonly minWidth?: number | undefined;
  /** The widest a resize may make the column, in CSS pixels. Defaults to 640. */
  readonly maxWidth?: number | undefined;
  /** The edge the column sticks to while the rows scroll sideways; left out, it scrolls with the rest. */
  readonly pin?: ColumnPin | undefined;
  /** True to wrap long cell text onto more lines, false to cut it with an ellipsis; left out, the browser decides. */
  readonly wrap?: boolean | undefined;
  /** False to keep the header's resize handle away when the table offers resizing. */
  readonly isResizable?: boolean | undefined;
}
