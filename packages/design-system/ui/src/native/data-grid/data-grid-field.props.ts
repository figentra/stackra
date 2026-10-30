/**
 * Stackra file contract:
 * Purpose: `DataGridFieldProps`, the props of the native DataGrid's field for one column in its edit sheets.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12); ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid).
 */
import type { DataGridColumn } from "#contracts/types/data-grid-column.type";

/** Props of one edit field. */
export interface DataGridFieldProps {
  /** The column, which picks the field. */
  readonly column: DataGridColumn;
  /** The draft: text, or a boolean for a boolean column. */
  readonly draft: string | boolean;
  /** Called as the draft changes. */
  readonly onDraftChange: (draft: string | boolean) => void;
  /** The error to show under the field. */
  readonly errorMessage?: string | undefined;
  /** The field's label; defaults to the column's. */
  readonly label?: string | undefined;
}
