/**
 * Stackra file contract:
 * Purpose: `WidgetSize`, the width a widget takes in a dashboard's 12-column grid: small 3, medium 6, large 9, full 12.
 * Boundary: values only.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decision 18: the Main grid's sizes); ADR 0305 (one declaration per file).
 */

/** The sizes of a widget in the dashboard grid. */
export const WidgetSize = Object.freeze(["small", "medium", "large", "full"] as const);

/** One widget size. */
export type WidgetSize = (typeof WidgetSize)[number];
