/**
 * Stackra file contract:
 * Purpose: `DataViewBoardProps`, the props of the web `DataViewBoard` in `data-view-board.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); data-collection plan (owner, 2026-10-29), wave 4 (Board).
 */
import type { ReactNode } from "react";

import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { DataViewBoard } from "#contracts/types/data-view-board.type";
import type { TableColumn } from "#contracts/types/table-column.type";

/** Props of the web DataViewBoard. */
export interface DataViewBoardProps<TItem extends CollectionItem = CollectionItem> {
  /** The engine whose rows are drawn. */
  readonly collection: CollectionController<TItem>;
  /** The records' name; each column's list is named "{label}: {column}". */
  readonly label: string;
  /** The field, the card and the move. */
  readonly board: DataViewBoard<TItem>;
  /** The content of a value; left out, the column's text. */
  readonly renderCell?: ((item: TItem, column: TableColumn) => ReactNode) | undefined;
  /** Called when a card is opened (a press, or Enter on it). */
  readonly onItemPress?: ((item: TItem) => void) | undefined;
  /** True to draw only the cards in view in each column. */
  readonly isVirtualized?: boolean | undefined;
}
