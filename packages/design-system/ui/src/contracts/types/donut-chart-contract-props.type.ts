/**
 * Stackra file contract:
 * Purpose: `DonutChartContractProps`, the props of every runtime's `DonutChart`: a pie with a hole that shows the
 *          total, written in the value format, above `centerLabel`.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */
import type { PieChartContractProps } from "#contracts/types/pie-chart-contract-props.type";

/** Props shared by the web and native `DonutChart`. */
export interface DonutChartContractProps extends PieChartContractProps {
  /** The word under the total in the hole, such as "Visitors"; no total is shown without it. */
  readonly centerLabel?: string | undefined;
}
