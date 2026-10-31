/**
 * Stackra file contract:
 * Purpose: the props every runtime's `DataGrid` takes: an editable grid of typed cells drawn from a `useCollection`
 *          engine (its rows, sorted and filtered, and its columns as arranged), its pending changes (kept by the grid,
 *          reported through `onChangesChange` and handed to `onSave`), the layout (`sheet` or a quantity `matrix`) and
 *          the web-only row height and scroll height.
 * Boundary: types only. Give `collection`, or the shorthand `items` and `columns`, which runs a client-mode engine of
 *           the grid's own. The grid never writes the rows: it keeps the edits as `DataGridChanges` until Save, which
 *           calls `onSave` with them; once the promise resolves the app passes the saved rows back in and the grid
 *           clears its changes. A column's `pin` freezes it. On web it is a spreadsheet (cell range, copy and paste of
 *           tab-separated text, fill handle, undo and redo); on a phone it is a list with a quick-edit sheet and a bulk
 *           edit. It replaced `rows`, `height`, `frozenColumns` and `DataGridColumn` on 2026-10-31.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid); ADR 0505 (one data
 *          family); WCAG 2.2 SC 1.3.1, 2.1.1, 3.3.1 and 4.1.2.
 */
import type { DataGridVariant } from "#contracts/enums/data-grid-variant.enum";
import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { DataGridChanges } from "#contracts/types/data-grid-changes.type";
import type { DataGridRow } from "#contracts/types/data-grid-row.type";

/** Props shared by the web and native `DataGrid`. */
export interface DataGridContractProps<TRow extends DataGridRow = DataGridRow> {
  /** The grid's spoken name, for example "Price list". */
  readonly label: string;
  /** The engine to draw from (`useCollection`): its rows, sort, filter, density and columns as arranged. */
  readonly collection?: CollectionController<TRow> | undefined;
  /** Shorthand without `collection`: the saved rows of a client-mode engine the grid runs itself. */
  readonly items?: readonly TRow[] | undefined;
  /** Shorthand without `collection`: the columns in reading order; the first names each row. */
  readonly columns?: readonly CollectionColumn[] | undefined;
  /** The key the grid's own engine keeps the user's column layout under; left out, nothing persists. */
  readonly collectionKey?: string | undefined;
  /** Saves the pending changes; a returned promise keeps Save busy, and the changes clear once it resolves. */
  readonly onSave?: ((changes: DataGridChanges) => void | Promise<void>) | undefined;
  /** Called with the pending changes each time they change, for example to warn before leaving. */
  readonly onChangesChange?: ((changes: DataGridChanges) => void) | undefined;
  /** True to show the values without letting them be edited. */
  readonly isReadOnly?: boolean | undefined;
  /** `sheet`, the default, or `matrix`: number cells with a total per row and per column. */
  readonly variant?: DataGridVariant | undefined;
  /** Web: the height of a row in CSS pixels; rows are virtualised at this height. Defaults to the engine's density. */
  readonly rowHeight?: number | undefined;
  /** Web: the height the rows scroll inside, as a CSS length. Defaults to `24rem`. */
  readonly maxHeight?: string | undefined;
  /**
   * Web: true to give each header a resize handle (drag it, or focus it and use the arrows, Home and End), drag to
   * reorder, and the column menu. Defaults to false.
   */
  readonly hasColumnTools?: boolean | undefined;
}
