/**
 * Stackra file contract:
 * Purpose: `RadialBarChartContractProps`, the props of every runtime's `RadialBarChart`: one ring per row, named by
 *          `nameKey`, filled to `valueKey` out of `maxValue`, with an optional total in the middle.
 * Boundary: types only. Rings fill clockwise from the top in both directions.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */
import type { DonutChartContractProps } from "#contracts/types/donut-chart-contract-props.type";

/** Props shared by the web and native `RadialBarChart`. */
export interface RadialBarChartContractProps extends DonutChartContractProps {
  /** The value of a full ring; the largest row's value by default. */
  readonly maxValue?: number | undefined;
}
