/**
 * Stackra file contract:
 * Purpose: `DataViewBoard`, what DataView's Board view needs: the column whose values are the board's columns (a
 *          `choice` column lists them in its options' order, any other column by the values found), what a card
 *          shows, and the move a drop (or the card's "Move to" menu) asks the app to make.
 * Boundary: types only; the board writes nothing: the app changes the row's value and passes the rows back.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29), wave 4 (Board view, kanban columns by a field, drag
 *          between columns, keyboard accessible); STA-1371.
 */
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { DataViewFields } from "#contracts/types/data-view-fields.type";

/** A board of cards in columns by one field. */
export interface DataViewBoard<TItem extends CollectionItem = CollectionItem> {
  /** The id of the column whose value places a card in a board column. */
  readonly field: string;
  /** What a card shows; defaults to the cards view's fields. */
  readonly card?: DataViewFields<TItem> | undefined;
  /** Called when a card is dropped on another column, or moved there from its menu, with the column's value. */
  readonly onMove: (item: TItem, value: string) => void | Promise<void>;
}
