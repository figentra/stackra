/**
 * Stackra file contract:
 * Purpose: `CollectionRowPanelProps`, the props of `CollectionRowPanel`, the side panel a DataTable or DataView row
 *          opens in.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); data-collection plan (owner, 2026-10-29), wave 3 (open in a side
 *          panel).
 */
import type { ReactNode } from "react";

import type { CollectionItem } from "#contracts/types/collection-item.type";

/** Props of the row side panel. */
export interface CollectionRowPanelProps<TItem extends CollectionItem = CollectionItem> {
  /** The records' name ("Orders"); the panel is named "<label> details". */
  readonly label: string;
  /** The row open in the panel, or `null` when it is shut. */
  readonly item: TItem | null;
  /** The panel's heading for the open row, usually its row header text. */
  readonly title: string;
  /** What the panel shows for the open row. */
  readonly renderPanel: (item: TItem) => ReactNode;
  /** Called when the panel is closed (its close button, Escape in the drawer). */
  readonly onClose: () => void;
  /** The page beside the panel: the table or the view. */
  readonly children: ReactNode;
}
