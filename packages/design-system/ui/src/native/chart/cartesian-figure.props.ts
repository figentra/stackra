/**
 * Stackra file contract:
 * Purpose: `CartesianFigureProps`, the props of the internal native `CartesianFigure` the area, line and column charts
 *          draw with.
 * Boundary: types only; not exported from the package.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { ChartSort } from "#contracts/enums/chart-sort.enum";
import type { ChartCurve } from "#contracts/enums/chart-curve.enum";
import type { CartesianChartContractProps } from "#contracts/types/cartesian-chart-contract-props.type";

/** A cartesian chart of one kind. */
export type CartesianFigureProps = CartesianChartContractProps & {
  readonly kind: "area" | "line" | "bar";
  readonly curve?: ChartCurve | undefined;
  readonly showDots?: boolean | undefined;
  /** Bar charts: the categories' order. */
  readonly sort?: ChartSort | undefined;
  readonly className?: string | undefined;
};
