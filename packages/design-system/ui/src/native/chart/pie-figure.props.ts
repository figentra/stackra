/**
 * Stackra file contract:
 * Purpose: `PieFigureProps`, the props of the internal native `PieFigure` PieChart and DonutChart draw with.
 * Boundary: types only; not exported from the package.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { DonutChartContractProps } from "#contracts/types/donut-chart-contract-props.type";

/** A pie, with a hole when `isDonut`. */
export type PieFigureProps = DonutChartContractProps & {
  readonly isDonut: boolean;
  readonly className?: string | undefined;
};
