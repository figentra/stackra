/**
 * Stackra file contract:
 * Purpose: `ChartLegendProps`, the props of the native `ChartLegend`.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; ADR 0060 (right-to-left); STA-1371 (chart style spec).
 */
import type { ChartPalette } from "#contracts/enums/chart-palette.enum";
import type { ChartSeries } from "#contracts/types/chart-series.type";

/** Props of the native ChartLegend. */
export interface ChartLegendProps {
  /** The series named, in order; each takes its colour as the chart does. */
  readonly series: readonly ChartSeries[];
  /** The palette the chart colours its series from; `accent` by default, as on the chart. */
  readonly palette?: ChartPalette | undefined;
  /** Called with a series' key when its entry is pressed; each entry is then a toggle (selected while shown). */
  readonly onToggle?: ((key: string) => void) | undefined;
  /** The keys of the series hidden from the plot: their swatch is hollow and their label struck through. */
  readonly hiddenKeys?: readonly string[] | undefined;
  /** Adds a dashed "Previous period" entry, for a chart drawing its comparison. */
  readonly showComparison?: boolean | undefined;
  /** Extra classes for the legend container. */
  readonly className?: string | undefined;
}
