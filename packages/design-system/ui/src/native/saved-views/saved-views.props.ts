/**
 * Stackra file contract:
 * Purpose: `SavedViewsProps`, the props of the native `SavedViews` in `saved-views.tsx`.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12); ADR 0505 (one saved-view model).
 */
import type { ViewProps } from "react-native";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { SavedViewsContractProps } from "#contracts/types/saved-views-contract-props.type";

/** Props of SavedViews: the shared contract plus the attributes of its root. */
export type SavedViewsProps<TItem extends CollectionItem = CollectionItem> =
  SavedViewsContractProps<TItem> & Omit<ViewProps, keyof SavedViewsContractProps | "children">;
