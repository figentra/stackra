/**
 * Stackra file contract:
 * Purpose: `sliceColorsOf`, the theme colour of each row of a pie or radial chart: its series' colour, matched by
 *          `nameKey`, or the set's colour by position for a row no series names.
 * Boundary: pure; names only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";
import type { ChartPalette } from "#contracts/enums/chart-palette.enum";
import type { ChartDatum } from "#contracts/types/chart-datum.type";
import type { ChartSeries } from "#contracts/types/chart-series.type";
import { chartColorOf } from "#core/functions/chart-color-of.function";

/** One colour name per row. */
export function sliceColorsOf(
  data: readonly ChartDatum[],
  series: readonly ChartSeries[],
  nameKey: string,
  palette?: ChartPalette,
): ChartColor[] {
  return data.map((row, index) => {
    const at = series.findIndex((item) => item.key === row[nameKey]);
    return chartColorOf(series[at], at === -1 ? index : at, palette);
  });
}
