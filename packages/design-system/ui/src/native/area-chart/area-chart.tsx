/**
 * Stackra file contract:
 * Purpose: the native `AreaChart`: one area per series, each edge in the series' theme colour over a fade to clear,
 *          overlapping or stacked, with the grid, category labels, press readout, legend and spoken numbers.
 * Boundary: draws through the internal `CartesianFigure` on Victory Native.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { ReactElement } from "react";

import type { AreaChartProps } from "#native/area-chart/area-chart.props";
import { CartesianFigure } from "#native/chart/cartesian-figure";

/** Overlapping or stacked areas over a category axis. */
export function AreaChart(props: AreaChartProps): ReactElement {
  return <CartesianFigure {...props} kind="area" />;
}
