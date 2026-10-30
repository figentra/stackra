/**
 * Stackra file contract:
 * Purpose: `DataViewScale`, the web DataView's tools for large collections (wave 4 of the collection family): virtual
 *          scrolling in every view, the table turning into cards below a width of its own, and the Board view.
 * Boundary: types only; web only, so the native DataView's contract is unchanged.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); data-collection plan (owner, 2026-10-29), wave 4 (scale); STA-1371.
 */
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { DataViewBoard } from "#contracts/types/data-view-board.type";

/** The web DataView's scale tools. */
export interface DataViewScale<TItem extends CollectionItem = CollectionItem> {
  /** True to draw only the rows, cards or board cards in view (React Aria's Virtualizer), for 10,000 rows and more. */
  readonly isVirtualized?: boolean | undefined;
  /**
   * The DataView's own width, in CSS pixels, under which the table view is drawn as cards (the engine's layout stays
   * `table`, so a wider frame shows the table again). Defaults to 600; `null` keeps the table at any width.
   */
  readonly cardsBelow?: number | null | undefined;
  /** Given, the view switcher offers the Board: cards in columns by one field, moved by drag or from a menu. */
  readonly board?: DataViewBoard<TItem> | undefined;
}
