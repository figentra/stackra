/**
 * Stackra file contract:
 * Purpose: `WIDGET_SPAN`, the grid span of each widget size: full width on a phone, its share of 12 columns from `md`.
 * Boundary: Tailwind classes; they take effect inside a `grid-cols-12` parent. Shared by `WidgetFrame` and
 *           `DashboardGrid`.
 * Runtime: browser
 * Governing contract: ADR 0307 (decision 18: the Main grid's sizes); STA-1371.
 */
import type { WidgetSize } from "#contracts/enums/widget-size.enum";

/** The grid span of each size. */
export const WIDGET_SPAN: Readonly<Record<WidgetSize, string>> = {
  small: "col-span-12 md:col-span-3",
  medium: "col-span-12 md:col-span-6",
  large: "col-span-12 md:col-span-9",
  full: "col-span-12",
};
