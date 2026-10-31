/**
 * Stackra file contract:
 * Purpose: `SavedViewTabsContractProps`, the props the web and native saved view tabs share: the `useCollection` engine
 *          whose views (the all-rows view, the presets and the `ViewStore`'s saved views, as `CollectionView`s) draw as
 *          tabs, and the tab list's spoken name.
 * Boundary: a type only; each `SavedViewTabsProps` is this contract.
 * Runtime: isomorphic
 * Governing contract: ADR 0271 (decisions 1 and 7); ADR 0359 (decision 14); ADR 0305 (`<name>.props.ts`); ADR 0505
 *          (one saved-view model).
 */
import type { CollectionController, CollectionItem } from "@stackra/ui/contracts";

/** Props of `SavedViewTabs`, on the web and on native. */
export interface SavedViewTabsContractProps<TItem extends CollectionItem = CollectionItem> {
  /** The engine whose views draw as tabs; choosing one applies it. */
  readonly collection: CollectionController<TItem>;
  /** The spoken name of the tab list. */
  readonly label: string;
}
