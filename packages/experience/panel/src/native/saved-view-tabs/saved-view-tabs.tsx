/**
 * Stackra file contract:
 * Purpose: `SavedViewTabs`, the native saved view picker: an all-rows tab, then one tab per saved view, each drawing the
 *          list under its view.
 * Boundary: draws only; the views come from the `ViewStore` the caller read. Only the selected tab's content is drawn,
 *           so one list query runs at a time. Board, gallery, calendar and chart layouts draw as the table until their
 *           renderers exist.
 * Runtime: react-native
 * Governing contract: ADR 0271 (decisions 1, 2 and 7); ADR 0359 (decision 14).
 */
import { Tabs } from "@stackra/ui/native";
import type { ReactElement } from "react";

import { savedViewTabsOf } from "#core/functions/saved-view-tabs-of.function";
import type { SavedViewTabsProps } from "#native/saved-view-tabs/saved-view-tabs.props";

/**
 * Tabs over a resource's saved views.
 *
 * @example
 * <SavedViewTabs label="Saved views" allLabel="All" views={views} render={(view) => <List view={view} />} />
 */
export function SavedViewTabs(props: SavedViewTabsProps): ReactElement {
  return <Tabs {...savedViewTabsOf(props)} />;
}
