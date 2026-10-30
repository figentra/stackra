/**
 * Stackra file contract:
 * Purpose: `PieChartContractProps`, the props of every runtime's `PieChart`: one slice per row, named by
 *          `nameKey` and sized by `valueKey`; `series` labels and colours each slice by its name.
 * Boundary: types only. Slices run clockwise from the top in both directions; a pie is not mirrored.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */
import type { ChartContractProps } from "#contracts/types/chart-contract-props.type";

/** Props shared by the web and native `PieChart`. */
export interface PieChartContractProps extends ChartContractProps {
  /** The key of each row's slice name, matched to a series' `key`. */
  readonly nameKey: string;
  /** The key of each row's value. */
  readonly valueKey: string;
}
