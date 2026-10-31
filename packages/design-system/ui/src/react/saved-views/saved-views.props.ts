/**
 * Stackra file contract:
 * Purpose: `SavedViewsProps`, the props of the web `SavedViews` in `saved-views.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); ADR 0505 (one saved-view model).
 */
import type { ComponentPropsWithoutRef } from "react";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { SavedViewsContractProps } from "#contracts/types/saved-views-contract-props.type";

/** Props of SavedViews: the shared contract plus the attributes of its root. */
export type SavedViewsProps<TItem extends CollectionItem = CollectionItem> =
  SavedViewsContractProps<TItem> &
    Omit<ComponentPropsWithoutRef<"div">, keyof SavedViewsContractProps | "children">;
