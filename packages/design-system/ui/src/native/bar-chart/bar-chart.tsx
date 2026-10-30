/**
 * Stackra file contract:
 * Purpose: the native `BarChart`: columns (`vertical`, the default) on Victory Native, grouped or stacked, or
 *          `horizontal` bars growing from the reading start with their values written after them.
 * Boundary: columns draw through `CartesianFigure`, bars through the View-drawn `HorizontalBars`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { ReactElement } from "react";

import type { BarChartProps } from "#native/bar-chart/bar-chart.props";
import { CartesianFigure } from "#native/chart/cartesian-figure";
import { HorizontalBars } from "#native/chart/horizontal-bars";

/** Columns or bars over a category axis. */
export function BarChart({ orientation, ...props }: BarChartProps): ReactElement {
  return orientation === "horizontal" ? (
    <HorizontalBars {...props} />
  ) : (
    <CartesianFigure {...props} kind="bar" />
  );
}
