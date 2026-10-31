/**
 * Stackra file contract:
 * Purpose: `SavedViewTabs`, the web saved view picker: `@stackra/ui`'s `SavedViews` drawn as tabs over a
 *          `useCollection` engine, one tab per view (all rows first, then the presets and the saved views).
 * Boundary: draws only; the views are the engine's, read from the `ViewStore` through a `CollectionStore` adapter.
 *           Choosing a tab applies its view to the one list.
 * Runtime: browser
 * Governing contract: ADR 0271 (decisions 1, 2 and 7); ADR 0359 (decision 14); ADR 0505 (one saved-view model).
 */
import { SavedViews } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { SavedViewTabsProps } from "#react/saved-view-tabs/saved-view-tabs.props";

/**
 * Tabs over a collection's views.
 *
 * @example
 * <SavedViewTabs collection={collection} label="Saved views" />
 */
export function SavedViewTabs({ collection, label }: SavedViewTabsProps): ReactElement {
  return <SavedViews variant="tabs" collection={collection} label={label} />;
}
