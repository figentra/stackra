/**
 * Stackra file contract:
 * Purpose: `SavedViewTabs`, the web saved view picker: an all-rows tab, then one tab per saved view, each drawing the
 *          list under its view.
 * Boundary: draws only; the views come from the `ViewStore` the caller read. Only the selected tab's content is drawn,
 *           so one list query runs at a time. Board, gallery, calendar and chart layouts draw as the table until their
 *           renderers exist.
 * Runtime: browser
 * Governing contract: ADR 0271 (decisions 1, 2 and 7); ADR 0359 (decision 14).
 */
import { Tabs } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { SavedViewTabsProps } from "#react/saved-view-tabs/saved-view-tabs.props";

/** The id of the all-rows tab; a saved view's public id never takes it. */
const ALL = "all";

/**
 * Tabs over a resource's saved views.
 *
 * @example
 * <SavedViewTabs label="Saved views" allLabel="All" views={views} render={(view) => <List view={view} />} />
 */
export function SavedViewTabs({
  label,
  allLabel,
  views,
  render,
}: SavedViewTabsProps): ReactElement {
  return (
    <Tabs
      label={label}
      defaultSelectedKeys={[ALL]}
      items={[
        { id: ALL, label: allLabel, content: render(undefined) },
        ...views.map((view) => ({ id: view.id, label: view.name, content: render(view) })),
      ]}
    />
  );
}
