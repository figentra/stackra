/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SavedViewsMenu` takes: the saved views of a collection, the one applied and the default, and the actions on them (apply, save, save as, rename, share, make default, delete).
 * Boundary: types only; the views are a `useCollection` engine's, so they persist with its state.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { CollectionView } from "#contracts/types/collection-view.type";

/** Props shared by the web and native `SavedViewsMenu`. */
export interface SavedViewsMenuContractProps<TItem extends CollectionItem = CollectionItem> {
  /** The engine whose views are listed and changed. */
  readonly collection: CollectionController<TItem>;
  /** The menu's name, for example "Order views". Defaults to the `ui` catalogue's "Views". */
  readonly label?: string | undefined;
  /** Called by "Share view" with the view; left out, there is no such item. The app decides what sharing means. */
  readonly onShareView?: ((view: CollectionView) => void) | undefined;
}
