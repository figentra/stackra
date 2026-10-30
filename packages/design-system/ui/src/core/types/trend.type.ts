/**
 * Stackra file contract:
 * Purpose: `Trend`, a change's direction, icon and tone (`trendOf`).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); ADR 0307 (decision 15); STA-1371.
 */
import type { TREND_ICON } from "#core/constants/trend-icon.constant";

/** A change's direction, icon and tone. */
export interface Trend {
  readonly direction: keyof typeof TREND_ICON;
  readonly icon: (typeof TREND_ICON)[keyof typeof TREND_ICON];
  readonly tone: "success" | "danger" | "default";
}
