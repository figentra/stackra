/**
 * Stackra file contract:
 * Purpose: `ChartFrameProps`, the props of the internal native `ChartFrame` every chart draws in.
 * Boundary: types only; not exported from the package.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { ReactNode } from "react";

import type { ChartPalette } from "#contracts/enums/chart-palette.enum";
import type { ChartSeries } from "#contracts/types/chart-series.type";

/** Props of the frame around a plot. */
export interface ChartFrameProps {
  /** The chart's accessible name. */
  readonly label: string;
  /** The chart's numbers read aloud after the name. */
  readonly spoken: string;
  /** The legend's series; no legend when empty. */
  readonly legend: readonly ChartSeries[];
  /** The palette the legend colours its swatches from, as the chart does. */
  readonly palette?: ChartPalette | undefined;
  /** Makes each legend entry a toggle that hides or shows its series. */
  readonly onToggle?: ((key: string) => void) | undefined;
  /** The series hidden from the plot. */
  readonly hiddenKeys?: readonly string[] | undefined;
  /** Adds the dashed "Previous period" legend entry. */
  readonly showComparison?: boolean | undefined;
  /** The pressed row's readout, above the plot. */
  readonly readout?: ReactNode;
  readonly className?: string | undefined;
  /** The plot. */
  readonly children: ReactNode;
}
