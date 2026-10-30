/**
 * Stackra file contract:
 * Purpose: `comparedSeriesOf`, the previous-period twins a cartesian chart draws when `showComparison` is on: each
 *          series with a `compareKey`, its position (for its colour) and its name, "Sales, previous period".
 * Boundary: pure.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { ChartSeries } from "#contracts/types/chart-series.type";
import type { ComparedSeries } from "#react/chart/compared-series.type";

/** The twins to draw; none unless `isOn`. */
export function comparedSeriesOf(
  series: readonly ChartSeries[],
  isOn: boolean | undefined,
  labelOf: (series: ChartSeries) => string,
): ComparedSeries[] {
  if (!isOn) return [];
  return series.flatMap((item, index) =>
    item.compareKey === undefined
      ? []
      : [{ series: item, index, key: item.compareKey, label: labelOf(item) }],
  );
}
