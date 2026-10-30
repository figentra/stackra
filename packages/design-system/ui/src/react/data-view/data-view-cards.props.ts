/**
 * Stackra file contract:
 * Purpose: `DataViewCardsProps`, the props of the web `DataViewCards`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); data-collection plan (owner, 2026-10-29).
 */
import type { ReactNode } from "react";

import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { DataViewFields } from "#contracts/types/data-view-fields.type";
import type { TableColumn } from "#contracts/types/table-column.type";

/** Props of the web DataViewCards. */
export interface DataViewCardsProps<TItem extends CollectionItem = CollectionItem> {
  /** The engine whose rows are drawn. */
  readonly collection: CollectionController<TItem>;
  /** The records' name, the grid's accessible name. */
  readonly label: string;
  /** What a card shows. */
  readonly fields?: DataViewFields<TItem> | undefined;
  /** The content of a value; left out, the column's text. */
  readonly renderCell?: ((item: TItem, column: TableColumn) => ReactNode) | undefined;
  /** Called when a card is pressed. */
  readonly onItemPress?: ((item: TItem) => void) | undefined;
  /** `cards` (the default) or `list`. */
  readonly layout?: "cards" | "list" | undefined;
  /** True to draw only the cards or rows in view (React Aria's Virtualizer), for thousands of rows. */
  readonly isVirtualized?: boolean | undefined;
}
