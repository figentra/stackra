/**
 * Stackra file contract:
 * Purpose: `heatPaintOf`, the colour of a native heatmap shade: the muted track for level 0, the chart colour at rising
 *          strength over the card's surface for levels 1 to 4.
 * Boundary: pure over Skia's colour parser.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import { alphaOf } from "#native/chart/alpha-of.function";
import type { ChartPaint } from "#native/chart/chart-paint.type";

/** How much of the chart colour each level carries, as an alpha over the card's surface. */
const STRENGTH = [0, 0.3, 0.52, 0.76, 1] as const;

/** The colour of shade `level` (0 to 4) drawn in the paint's first series colour. */
export function heatPaintOf(level: number, paint: ChartPaint): string {
  if (level <= 0) return paint.grid;
  return alphaOf(paint.series[0] ?? paint.muted, STRENGTH[Math.min(level, 4)] ?? 1);
}
