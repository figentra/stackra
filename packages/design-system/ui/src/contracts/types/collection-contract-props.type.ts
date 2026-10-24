/**
 * Stackra file contract:
 * Purpose: the props a collection of items takes whatever it draws them as: the items, what shows when there are none,
 *          and whether more are on their way. Table, List and Tabs extend it, so one set of words feeds any of them
 *          from a query's result.
 * Boundary: types only. An empty result and a loading one are different states: `emptyState` shows only when `isLoading`
 *           is false and `items` is empty. The selection props are `SelectionContractProps`, kept apart because Tabs
 *           always selects exactly one.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313; WCAG 2.2 SC 4.1.3 (status messages).
 */
import type { ReactNode } from "react";

import type { CollectionItem } from "#contracts/types/collection-item.type";

/** Props shared by every collection on web and native. */
export interface CollectionContractProps<TItem extends CollectionItem = CollectionItem> {
  /** The items, in order. The collection never sorts or filters them: the query that fetched them did. */
  readonly items: readonly TItem[];
  /** What the collection shows when `items` is empty and nothing is loading, usually an `EmptyState`. */
  readonly emptyState?: ReactNode;
  /** True while items load: the collection is busy, and shows its loading state in place of the empty one. */
  readonly isLoading?: boolean | undefined;
  /** The spoken name of what loads, for example "Loading orders"; it is read only while `isLoading` is true. */
  readonly loadingLabel?: string | undefined;
}
