/**
 * Stackra file contract:
 * Purpose: `composedSeriesOf`, a composed chart's series with each line that names no colour of its own drawn in
 *          `chart-4` (the categorical amber), so a target or margin line stands apart from the columns, which take
 *          the accent steps, in both schemes; the legend reads the same colours.
 * Boundary: pure; a series that names its colour keeps it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9); STA-1371.
 */
import type { ChartSeries } from "#contracts/types/chart-series.type";

/** `series`, its uncoloured lines (`lineKeys`) in the line colour. */
export function composedSeriesOf<T extends ChartSeries>(
  series: readonly T[],
  lineKeys: ReadonlySet<string>,
): T[] {
  return series.map((item) =>
    lineKeys.has(item.key) && item.color === undefined ? { ...item, color: "chart-4" } : item,
  );
}
