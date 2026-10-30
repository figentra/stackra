/**
 * Stackra file contract:
 * Purpose: `ChartLegendProps`, the props of the web `ChartLegend`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0291 (ported code); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import type { ChartPalette } from "#contracts/enums/chart-palette.enum";
import type { ChartSeries } from "#contracts/types/chart-series.type";

/** Props of the web ChartLegend. */
export interface ChartLegendProps {
  /** The series named, in order; each takes its colour as the chart does. */
  readonly series: readonly ChartSeries[];
  /** The palette the chart's series take by position; `accent` by default. */
  readonly palette?: ChartPalette | undefined;
  /**
   * Called with a series' key when its entry is pressed; each entry is then a toggle button (`aria-pressed` while
   * the series is shown). Every chart passes it, so a reader can hide and show series.
   */
  readonly onToggle?: ((key: string) => void) | undefined;
  /** The keys of the series hidden from the plot: their swatch is hollow and their label struck through. */
  readonly hiddenKeys?: readonly string[] | undefined;
  /** Adds a dashed "Previous period" entry, for a chart drawing its comparison. */
  readonly showComparison?: boolean | undefined;
  /** Extra classes for the legend container. */
  readonly className?: string | undefined;
}
