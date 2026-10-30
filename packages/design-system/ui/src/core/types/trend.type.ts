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
  /** Whether the value went up, down or stayed flat. */
  readonly direction: keyof typeof TREND_ICON;
  /** The arrow icon for the direction. */
  readonly icon: (typeof TREND_ICON)[keyof typeof TREND_ICON];
  /** The colour tone: good, bad or neutral. */
  readonly tone: "success" | "danger" | "default";
}
