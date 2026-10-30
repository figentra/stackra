/**
 * Stackra file contract:
 * Purpose: `DASHBOARD_SPAN`, the grid span of each tile size in a `DashboardGrid`: full width while the grid is narrow,
 *          its share of 12 columns once the grid itself is 48rem wide (a container query, not the viewport's `md`).
 * Boundary: Tailwind classes; they take effect inside the `grid-cols-12` grid that `DashboardGrid` wraps in an
 *           `@container`. `WidgetFrame` keeps `WIDGET_SPAN`, since an app's own grid need not be a container.
 * Runtime: browser
 * Governing contract: ADR 0307 (decision 18: the Main grid's sizes); STA-1371.
 */
import type { WidgetSize } from "#contracts/enums/widget-size.enum";

/** The grid span of each tile size, by the grid's own width. */
export const DASHBOARD_SPAN: Readonly<Record<WidgetSize, string>> = {
  small: "col-span-12 @3xl:col-span-3",
  medium: "col-span-12 @3xl:col-span-6",
  large: "col-span-12 @3xl:col-span-9",
  full: "col-span-12",
};
