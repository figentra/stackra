/**
 * Stackra file contract:
 * Purpose: `savedViewTabsOf`, the `Tabs` props of a saved view picker: an all-rows tab first and selected, then the
 *          resource's preset view tabs, then one tab per saved view, each drawing the list under its view.
 * Boundary: a pure function the web and native `SavedViewTabs` share, so both pickers list the same tabs. Each tab's
 *           content is the caller's `render` result; `Tabs` draws only the selected one.
 * Runtime: isomorphic
 * Governing contract: ADR 0271 (decisions 1, 2 and 7); ADR 0359 (decision 14).
 */
import type { TabsContractProps } from "@stackra/ui/contracts";

import type { SavedViewTabsContractProps } from "#core/types/saved-view-tabs-contract-props.type";

/** The id of the all-rows tab; a saved view's public id never takes it. */
const ALL = "all";

/**
 * The tabs over `views`.
 *
 * @example
 * return <Tabs {...savedViewTabsOf(props)} />;
 */
export function savedViewTabsOf({
  label,
  allLabel,
  presets = [],
  views,
  render,
}: SavedViewTabsContractProps): TabsContractProps {
  return {
    label,
    defaultSelectedKeys: [ALL],
    items: [
      { id: ALL, label: allLabel, content: render(undefined) },
      ...presets,
      ...views.map((view) => ({ id: view.id, label: view.name, content: render(view) })),
    ],
  };
}
