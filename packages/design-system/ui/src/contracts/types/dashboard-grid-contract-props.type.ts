/**
 * Stackra file contract:
 * Purpose: `DashboardGridContractProps`, the props of every runtime's `DashboardGrid`: the tiles, how each is drawn and
 *          named, the edit mode in which they are reordered and resized, and the layout's owner (the caller, or a
 *          `DashboardLayoutPort`).
 * Boundary: types only. Controlled with `layout` and `onLayoutChange`; otherwise it starts from `defaultLayout`, loads
 *           the saved layout through `layoutPort` and saves every change there.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0307 (decisions 16 and 18); STA-1371.
 */
import type { ReactNode } from "react";

import type { DashboardLayout } from "#contracts/types/dashboard-layout.type";
import type { DashboardLayoutPort } from "#contracts/types/dashboard-layout-port.type";

/** Props shared by the web and native `DashboardGrid`. */
export interface DashboardGridContractProps {
  /** The grid's accessible name, such as "Sales overview". */
  readonly label: string;
  /** Draws the tile with this id, usually a `WidgetFrame`. */
  readonly renderTile: (id: string) => ReactNode;
  /** The tile's name, read by the move and size controls and their announcements. */
  readonly tileLabel: (id: string) => string;
  /** The layout, when the caller owns it. */
  readonly layout?: DashboardLayout | undefined;
  /** The starting layout when uncontrolled, and the full set of tiles a saved layout is reconciled with. */
  readonly defaultLayout?: DashboardLayout | undefined;
  /** Called with the whole new layout after each move or resize. */
  readonly onLayoutChange?: ((layout: DashboardLayout) => void) | undefined;
  /** Where an uncontrolled grid loads and saves the reader's layout. */
  readonly layoutPort?: DashboardLayoutPort | undefined;
  /** Shows each tile's drag handle, move and size controls (web; native lists the tiles by name to reorder). Off by default. */
  readonly isEditing?: boolean | undefined;
}
