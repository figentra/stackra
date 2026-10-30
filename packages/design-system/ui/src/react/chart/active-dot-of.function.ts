/**
 * Stackra file contract:
 * Purpose: `activeDotOf`, the dot Recharts draws on the pointed point of a line or area: the series' colour with a 2px
 *          ring of the surface, so it stands off its own line.
 * Boundary: pure; SVG presentation attributes only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); chart style spec (2026-10-28) section 3; STA-1371.
 */
import { CHART_PAINT } from "#react/chart/chart-paint.constant";

/** The active dot of a series painted `color`. */
export function activeDotOf(color: string): {
  readonly r: number;
  readonly fill: string;
  readonly stroke: string;
  readonly strokeWidth: number;
} {
  return { r: 4, fill: color, stroke: CHART_PAINT.surface, strokeWidth: 2 };
}
