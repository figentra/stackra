/**
 * Stackra file contract:
 * Purpose: the native `PieChart`: one slice per row, clockwise from the top, in its series' theme colour; the legend
 *          is off unless `showLegend`.
 * Boundary: draws through the internal `PieFigure` it shares with `DonutChart`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { ReactElement } from "react";

import { PieFigure } from "#native/chart/pie-figure";
import type { PieChartProps } from "#native/pie-chart/pie-chart.props";

/** A pie of the rows' shares. */
export function PieChart(props: PieChartProps): ReactElement {
  return <PieFigure {...props} isDonut={false} />;
}
