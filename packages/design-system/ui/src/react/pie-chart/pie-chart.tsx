/**
 * Stackra file contract:
 * Purpose: the web `PieChart`: one slice per row, clockwise from the top, in its series' theme colour, with a tooltip
 *          and the data table; the legend is off unless `showLegend`.
 * Boundary: draws through the internal `PieFigure` it shares with `DonutChart`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { ReactElement } from "react";

import { PieFigure } from "#react/chart/pie-figure";
import type { PieChartProps } from "#react/pie-chart/pie-chart.props";

/** A pie of the rows' shares. */
export function PieChart(props: PieChartProps): ReactElement {
  return <PieFigure {...props} isDonut={false} />;
}
