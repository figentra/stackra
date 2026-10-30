/**
 * Stackra file contract:
 * Purpose: `ColumnMenuProps`, the props of the web `ColumnMenu` in `column-menu.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); data-collection plan (owner, 2026-10-29).
 */
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { ResolvedCollectionColumn } from "#contracts/types/resolved-collection-column.type";

/** Props of the header menu of one column. */
export interface ColumnMenuProps<TItem extends CollectionItem = CollectionItem> {
  /** The column, as drawn. */
  readonly column: ResolvedCollectionColumn;
  /** The engine the menu changes. */
  readonly collection: CollectionController<TItem>;
  /** Starts a keyboard resize of the column; left out, there is no "Resize column". */
  readonly onStartResize?: (() => void) | undefined;
  /** Called by "Filter by this column"; left out, there is no such item. */
  readonly onFilterColumn?: ((columnId: string) => void) | undefined;
}
