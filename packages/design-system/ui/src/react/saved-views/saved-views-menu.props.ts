/**
 * Stackra file contract:
 * Purpose: `SavedViewsMenuProps`, the props of the web `SavedViewsMenu` in `saved-views-menu.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); data-collection plan (owner, 2026-10-29).
 */
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { SavedViewsMenuContractProps } from "#contracts/types/saved-views-menu-contract-props.type";

/** Props of the web SavedViewsMenu. */
export type SavedViewsMenuProps<TItem extends CollectionItem = CollectionItem> =
  SavedViewsMenuContractProps<TItem>;
