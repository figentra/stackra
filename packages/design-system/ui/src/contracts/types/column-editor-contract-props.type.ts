/**
 * Stackra file contract:
 * Purpose: the props every runtime's `ColumnEditor` takes: the collection engine whose columns it arranges, the
 *          trigger's text and whether the trigger shows its text.
 * Boundary: types only; every change goes to the engine.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3).
 */
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";

/** Props shared by the web and native `ColumnEditor`. */
export interface ColumnEditorContractProps<TItem extends CollectionItem = CollectionItem> {
  /** The engine whose columns are arranged (`useCollection`). */
  readonly collection: CollectionController<TItem>;
  /** The trigger's text and the editor's name. Defaults to the `ui` catalogue's "Columns". */
  readonly label?: string | undefined;
  /** True to draw the trigger as an icon button (its text stays its name). */
  readonly isIconOnly?: boolean | undefined;
}
