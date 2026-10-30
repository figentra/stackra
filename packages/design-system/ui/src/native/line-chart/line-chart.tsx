/**
 * Stackra file contract:
 * Purpose: the native `LineChart`: one line per series in its theme colour, dots optional, with the grid, category
 *          labels, press readout, legend and spoken numbers.
 * Boundary: draws through the internal `CartesianFigure` on Victory Native.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { ReactElement } from "react";

import { CartesianFigure } from "#native/chart/cartesian-figure";
import type { LineChartProps } from "#native/line-chart/line-chart.props";

/** Lines over a category axis. */
export function LineChart(props: LineChartProps): ReactElement {
  return <CartesianFigure {...props} kind="line" />;
}
