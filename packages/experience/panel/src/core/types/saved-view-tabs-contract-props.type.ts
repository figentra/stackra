/**
 * Stackra file contract:
 * Purpose: `SavedViewTabsContractProps`, the props the web and native saved view tabs share: the views, the label of
 *          the all-rows tab and what each tab draws.
 * Boundary: a type only; each `SavedViewTabsProps` is this contract, and `savedViewTabsOf` reads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0271 (decisions 1 and 7); ADR 0359 (decision 14); ADR 0305 (`<name>.props.ts`).
 */
import type { TabItem } from "@stackra/ui/contracts";

import type { SavedView } from "#core/schemas/saved-view.schema";

/** Props of `SavedViewTabs`, on the web and on native. */
export interface SavedViewTabsContractProps {
  /** The spoken name of the tab list. */
  readonly label: string;
  /** The text of the first tab, which draws the list with no view. */
  readonly allLabel: string;
  /** The views the viewer may see, in the store's order. */
  readonly views: readonly SavedView[];
  /** What the selected tab draws: the list under `view`, or with no view for the first tab. */
  readonly render: (view: SavedView | undefined) => TabItem["content"];
}
