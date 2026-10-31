/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SavedViews` takes, the one saved-views component of the data family: the
 *          `useCollection` engine whose views it lists and changes (apply, save, save as, rename, share, make default,
 *          delete), and how it is drawn: a `menu` (the default), `tabs` or a row of `chips`.
 * Boundary: types only. The views are the engine's `CollectionView`s, so they persist with its state through its
 *           `CollectionStore` (the browser by default, a product's server store through an adapter). The tabs and chips
 *           apply a view; the menu also saves and manages them. It replaced `SavedViewsMenu`, the `ResourceQuery`
 *           `SavedViews` and FilterPanel's view tabs on 2026-10-31.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); ADR 0505 (one saved-view model);
 *          STA-1371.
 */
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { CollectionView } from "#contracts/types/collection-view.type";

/** Props shared by the web and native `SavedViews`. */
export interface SavedViewsContractProps<TItem extends CollectionItem = CollectionItem> {
  /** The engine whose views are listed and changed. */
  readonly collection: CollectionController<TItem>;
  /** The component's name, for example "Order views". Defaults to the `ui` catalogue's "Views". */
  readonly label?: string | undefined;
  /** `menu` (the default: apply, save and manage), `tabs` or `chips` (apply only). */
  readonly variant?: "menu" | "tabs" | "chips" | undefined;
  /** Called by "Share view" with the view; left out, there is no such item. The app decides what sharing means. */
  readonly onShareView?: ((view: CollectionView) => void) | undefined;
}
