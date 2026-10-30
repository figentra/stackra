/**
 * Stackra file contract:
 * Purpose: `trendOf`, which way a change goes (up, down or flat), the icon it wears and its tone once the better
 *          direction is known: a rise in refunds is `danger`.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decision 15: the display adds the better direction); STA-1371.
 */
import type { TrendDirection } from "#contracts/enums/trend-direction.enum";
import { TREND_ICON } from "#core/constants/trend-icon.constant";
import type { Trend } from "#core/types/trend.type";

/** The trend of a change `value` when `better` is the good direction. */
export function trendOf(value: number, better: TrendDirection = "up"): Trend {
  if (!Number.isFinite(value) || value === 0)
    return { direction: "flat", icon: TREND_ICON.flat, tone: "default" };
  const direction = value > 0 ? "up" : "down";
  return {
    direction,
    icon: TREND_ICON[direction],
    tone: direction === better ? "success" : "danger",
  };
}
