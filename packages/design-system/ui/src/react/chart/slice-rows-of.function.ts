/**
 * Stackra file contract:
 * Purpose: `sliceRowsOf`, a pie's or radial chart's rows ready for Recharts: each row gains its series' label (`name`)
 *          and theme paint (`fill`), matched by `nameKey`; a row with no series takes the set's colour by position.
 * Boundary: pure; the caller's rows are not changed.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { ChartDatum } from "#contracts/types/chart-datum.type";
import type { ChartPalette } from "#contracts/enums/chart-palette.enum";
import type { ChartSeries } from "#contracts/types/chart-series.type";
import { chartColorOf } from "#core/functions/chart-color-of.function";
import { paintOf } from "#react/chart/paint-of.function";

/** The rows of a pie or radial chart with their label and paint. */
export function sliceRowsOf(
  data: readonly ChartDatum[],
  series: readonly ChartSeries[],
  nameKey: string,
  palette?: ChartPalette,
): Record<string, unknown>[] {
  return data.map((row, index) => {
    const at = series.findIndex((item) => item.key === row[nameKey]);
    const item = series[at];
    return {
      ...row,
      name: item?.label ?? String(row[nameKey] ?? ""),
      fill: paintOf(chartColorOf(item, at === -1 ? index : at, palette)),
    };
  });
}
