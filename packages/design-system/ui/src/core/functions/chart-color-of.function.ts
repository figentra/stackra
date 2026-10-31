/**
 * Stackra file contract:
 * Purpose: `chartColorOf`, the theme colour a chart series is drawn in: its own, or by its position the accent step
 *          `chart-ramp-<n>` (the default palette) or the categorical `chart-<n>`.
 * Boundary: pure; names only, each runtime turns the name into its theme's value.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same output on web and native); ADR 0192 (digits); ADR 0060 (Arabic); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";
import type { ChartPalette } from "#contracts/enums/chart-palette.enum";
import type { ChartSeries } from "#contracts/types/chart-series.type";

/** The categorical set's size: the sixth series takes chart-1 again. */
const SET_SIZE = 5;

/**
 * The ramp's steps in series order (ADR 0501): the accent (the centre step) first, then each next colour at least two
 * steps from the one before, so neighbouring series never sit one lightness step apart.
 */
const RAMP_ORDER = [3, 1, 5, 2, 4] as const;

/**
 * The colour of the series at `index`.
 * @param series - the series, whose own colour wins
 * @param index - its position in the chart's series
 * @param palette - the set a position picks from: the accent steps by default
 * @returns a theme colour name, such as `chart-ramp-2`
 */
export function chartColorOf(
  series: ChartSeries | undefined,
  index: number,
  palette: ChartPalette = "accent",
): ChartColor {
  const step = (index % SET_SIZE) + 1;
  return (
    series?.color ??
    ((palette === "accent"
      ? `chart-ramp-${RAMP_ORDER[index % SET_SIZE]}`
      : `chart-${step}`) as ChartColor)
  );
}
