/**
 * Stackra file contract:
 * Purpose: `DashboardTile`, one tile of a `DashboardGrid` layout: the widget's id and the share of the grid it spans.
 * Boundary: types only; plain data, so a layout saves as JSON through a `DashboardLayoutPort`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decision 18: the Main grid's sizes); ADR 0305 (one declaration per file); STA-1371.
 */
import type { WidgetSize } from "#contracts/enums/widget-size.enum";

/** One tile of a dashboard layout. */
export interface DashboardTile {
  /** The widget's id; `renderTile` and `tileLabel` are called with it. */
  readonly id: string;
  /** The columns it spans in the 12-column grid (web); native fills the width. */
  readonly size: WidgetSize;
}
