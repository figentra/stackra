/**
 * Stackra file contract:
 * Purpose: the web `DonutChart`: a pie with a hole that shows the total, in the value format, above `centerLabel`.
 * Boundary: draws through the internal `PieFigure` it shares with `PieChart`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { ReactElement } from "react";

import { PieFigure } from "#react/chart/pie-figure";
import type { DonutChartProps } from "#react/donut-chart/donut-chart.props";

/** A ring of the rows' shares around their total. */
export function DonutChart(props: DonutChartProps): ReactElement {
  return <PieFigure {...props} isDonut />;
}
