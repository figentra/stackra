/**
 * Stackra file contract:
 * Purpose: `SavedViewTabsProps`, the props of the native saved view tabs: the views, the label of the all-rows tab and
 *          what each tab draws.
 * Boundary: props only.
 * Runtime: react-native
 * Governing contract: ADR 0271 (decisions 1 and 7); ADR 0359 (decision 14).
 */
import type { ReactNode } from "react";

import type { SavedView } from "#core/schemas/saved-view.schema";

/** Props of `SavedViewTabs`. */
export interface SavedViewTabsProps {
  /** The spoken name of the tab list. */
  readonly label: string;
  /** The text of the first tab, which draws the list with no view. */
  readonly allLabel: string;
  /** The views the viewer may see, in the store's order. */
  readonly views: readonly SavedView[];
  /** What the selected tab draws: the list under `view`, or with no view for the first tab. */
  readonly render: (view: SavedView | undefined) => ReactNode;
}
