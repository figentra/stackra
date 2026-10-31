/**
 * Stackra file contract:
 * Purpose: `DataTableRows`, the web DataTable's row tools (wave 3 of the collection family): drag to reorder, hover
 *          row actions and the row context menu, expandable rows, opening a row in the side panel and inline edit of
 *          the columns marked `isEditable` with the DataGrid's editors.
 * Boundary: types only; web only, so the native DataTable's contract is unchanged. The table writes nothing: each tool
 *           calls the app, which passes the new rows back.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); data-collection plan (owner, 2026-10-29), wave 3 (rows); ADR 0505 (the editable columns are the engine's); STA-1371.
 */
import type { ReactNode } from "react";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { DataGridValue } from "#contracts/types/data-grid-value.type";

/** The web DataTable's row tools. */
export interface DataTableRows<TItem extends CollectionItem = CollectionItem> {
  /**
   * Given, each row gets a drag handle (pointer, keyboard and screen reader, through React Aria's drag and drop) and a
   * drop calls this with the rows shown in their new order (group and total rows left out). Nothing moves until the
   * app passes the rows back; reordering a sorted view is the app's call.
   */
  readonly onReorder?: ((items: readonly TItem[]) => void) | undefined;
  /**
   * True to draw the row actions that have an icon as buttons revealed on hover or keyboard focus, beside the row
   * menu, which still lists them all.
   */
  readonly hasHoverActions?: boolean | undefined;
  /** False to leave the browser's own menu on a right-click; by default a row's right-click (or Shift+F10) opens its actions. */
  readonly hasContextMenu?: boolean | undefined;
  /** Given, each row gets a disclosure button and an expanded row shows this under it across every column. */
  readonly renderRowDetail?: ((item: TItem) => ReactNode) | undefined;
  /** The ids of the expanded rows, for a controlled expansion. */
  readonly expandedKeys?: readonly string[] | undefined;
  /** The ids of the rows expanded at first. */
  readonly defaultExpandedKeys?: readonly string[] | undefined;
  /** Called with the ids of the expanded rows after a row or "expand all" is pressed. */
  readonly onExpandedChange?: ((keys: readonly string[]) => void) | undefined;
  /** Called when a row is opened: a press on the row (Enter from the keyboard). */
  readonly onRowOpen?: ((item: TItem) => void) | undefined;
  /** Given, an opened row shows this in a resizable side panel beside the table (a drawer on a small screen). */
  readonly renderRowPanel?: ((item: TItem) => ReactNode) | undefined;
  /**
   * Called with a valid edited value of a column marked `isEditable` (its `type` picks the DataGrid editor, its rules
   * validate the value); the app writes the row. A returned promise is awaited: a rejection is shown on the cell.
   */
  readonly onCellEdit?:
    | ((item: TItem, columnId: string, value: DataGridValue) => void | Promise<void>)
    | undefined;
}
