/**
 * Stackra file contract:
 * Purpose: `HorizontalBarsProps`, the props of the internal native `HorizontalBars`.
 * Boundary: types only; not exported from the package.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { ChartSort } from "#contracts/enums/chart-sort.enum";
import type { CartesianChartContractProps } from "#contracts/types/cartesian-chart-contract-props.type";

/** Bars lying along their categories. */
export type HorizontalBarsProps = CartesianChartContractProps & {
  readonly className?: string | undefined;
  /** The categories' order. */
  readonly sort?: ChartSort | undefined;
};
