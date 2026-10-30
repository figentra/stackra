/**
 * Stackra file contract:
 * Purpose: `PieFigureProps`, the props of the internal `PieFigure` the web PieChart and DonutChart draw with.
 * Boundary: types only; not exported from the package.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { DonutChartProps } from "#react/donut-chart/donut-chart.props";

/** A pie, with a hole when `isDonut`. */
export type PieFigureProps = DonutChartProps & { readonly isDonut: boolean };
