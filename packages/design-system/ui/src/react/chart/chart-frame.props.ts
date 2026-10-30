/**
 * Stackra file contract:
 * Purpose: `ChartFrameProps`, the props of the internal `ChartFrame` every web chart draws in.
 * Boundary: types only; not exported from the package.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0291 (ported code); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import type { ReactNode } from "react";

import type { ChartPalette } from "#contracts/enums/chart-palette.enum";
import type { ChartSeries } from "#contracts/types/chart-series.type";
import type { ChartTable } from "#contracts/types/chart-table.type";

/** Props of the frame around a plot. */
export interface ChartFrameProps {
  /** The data table's caption, the chart's name. */
  readonly label: string;
  /** The chart's numbers as text. */
  readonly table: ChartTable;
  /** The legend's series; no legend when empty. */
  readonly legend: readonly ChartSeries[];
  /** The legend's palette. */
  readonly palette?: ChartPalette | undefined;
  /** Makes each legend entry a toggle that hides or shows its series. */
  readonly onToggle?: ((key: string) => void) | undefined;
  /** The series hidden from the plot. */
  readonly hiddenKeys?: readonly string[] | undefined;
  /** Adds the dashed "Previous period" legend entry. */
  readonly showComparison?: boolean | undefined;
  /** Lines read after the data table, such as each reference line's label and value. */
  readonly notes?: readonly string[] | undefined;
  readonly className?: string | undefined;
  /** The plot. */
  readonly children: ReactNode;
}
