/**
 * Stackra file contract:
 * Purpose: one tab of a Tabs: its key, the text on the tab, the content of its panel and whether it can be used. The
 *          list of them is the `items` prop, so both runtimes draw the same tabs and panels from the same data.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0313.
 */
import type { ReactNode } from "react";

import type { CollectionItem } from "#contracts/types/collection-item.type";

/** One tab of a Tabs, with the panel it opens. */
export interface TabItem extends CollectionItem {
  /** The text of the tab; it is the tab's accessible name. */
  readonly label: string;
  /** What the panel shows while this tab is selected; it is not drawn for the other tabs. */
  readonly content: ReactNode;
  /** True to show the tab but refuse selecting it. */
  readonly isDisabled?: boolean | undefined;
}
