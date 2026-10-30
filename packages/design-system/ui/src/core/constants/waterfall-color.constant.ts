/**
 * Stackra file contract:
 * Purpose: `WATERFALL_COLOR`, the theme colour of each kind of waterfall bar: totals in the accent's first step, rises
 *          in success and falls in danger.
 * Boundary: values only; web and native read the same names.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";

/** The colour of each bar kind. */
export const WATERFALL_COLOR: Readonly<Record<"total" | "up" | "down", ChartColor>> = {
  total: "chart-ramp-1",
  up: "success",
  down: "danger",
};
