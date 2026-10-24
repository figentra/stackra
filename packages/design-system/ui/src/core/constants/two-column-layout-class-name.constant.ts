/**
 * Stackra file contract:
 * Purpose: the grid classes of the web `TwoColumnLayout` for each collapse breakpoint: one column below it and the
 *          main column plus a 20 rem side column from it up. The columns are placed by the grid in document order, so
 *          the side column is at the logical end and mirrors in right-to-left with no `rtl:` class.
 * Boundary: data only. The class names are written out in full so Tailwind finds them when it scans this package
 *           (`@source`); never build them from a template. `minmax(0,1fr)` lets the main column shrink below the width of
 *           its widest child, so a table in it scrolls instead of pushing the side column out.
 * Runtime: isomorphic
 * Governing contract: ADR 0314 (decision 6, widths are named); ADR 0060 (right-to-left); WCAG 2.2 SC 1.4.10.
 */
import type { LayoutBreakpoint } from "#contracts/enums/layout-breakpoint.enum";

/** The grid classes of each breakpoint. */
export const TWO_COLUMN_LAYOUT_CLASS_NAME = Object.freeze({
  sm: "grid grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_20rem]",
  md: "grid grid-cols-1 items-start gap-3 md:grid-cols-[minmax(0,1fr)_20rem]",
  lg: "grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]",
  xl: "grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_20rem]",
} as const satisfies Record<LayoutBreakpoint, string>);
