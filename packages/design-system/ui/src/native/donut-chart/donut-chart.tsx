/**
 * Stackra file contract:
 * Purpose: the native `DonutChart`: a pie with a hole that shows the total, in the value format, above `centerLabel`.
 * Boundary: draws through the internal `PieFigure` it shares with `PieChart`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { ReactElement } from "react";

import { PieFigure } from "#native/chart/pie-figure";
import type { DonutChartProps } from "#native/donut-chart/donut-chart.props";

/** A ring of the rows' shares around their total. */
export function DonutChart(props: DonutChartProps): ReactElement {
  return <PieFigure {...props} isDonut />;
}
