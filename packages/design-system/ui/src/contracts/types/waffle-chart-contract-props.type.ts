/**
 * Stackra file contract:
 * Purpose: `WaffleChartContractProps`, the props of every runtime's `WaffleChart`: parts of a whole as a grid of
 *          squares (10 by 10 by default, so one square is one percent), one run of squares per row in its series'
 *          colour, with a legend of each part's value and share.
 * Boundary: types only. Squares fill row by row from the reading start, so the grid follows the reading direction.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ChartContractProps } from "#contracts/types/chart-contract-props.type";

/** Props shared by the web and native `WaffleChart`. */
export interface WaffleChartContractProps extends Omit<
  ChartContractProps,
  "height" | "showTooltip"
> {
  /** The key of each row's part name, matched to a series' `key`. */
  readonly nameKey: string;
  /** The key of each row's value. */
  readonly valueKey: string;
  /** Squares per row; 10 by default. */
  readonly columns?: number | undefined;
  /** Rows of squares; 10 by default. */
  readonly rows?: number | undefined;
  /** The colours parts take by position: the `categorical` set by default, since a waffle tells parts apart by colour. */
  readonly palette?: ChartContractProps["palette"];
}
