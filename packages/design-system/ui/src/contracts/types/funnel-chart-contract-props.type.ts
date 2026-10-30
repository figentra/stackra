/**
 * Stackra file contract:
 * Purpose: `FunnelChartContractProps`, the props of every runtime's `FunnelChart`: the stages in order, the name, the
 *          number format, the colour and whether each step shows its conversion from the step before.
 * Boundary: types only. Bars are centred and as wide as their share of the first stage; the numbers are text, so they
 *           are read and shaped like any other text.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */
import type { ChartSort } from "#contracts/enums/chart-sort.enum";
import type { ChartColor } from "#contracts/enums/chart-color.enum";
import type { FunnelStage } from "#contracts/types/funnel-stage.type";

/** Props shared by the web and native `FunnelChart`. */
export interface FunnelChartContractProps {
  /** The steps, from the widest (first) to the narrowest. */
  readonly stages: readonly FunnelStage[];
  /** The chart's accessible name, such as "Checkout funnel, October". */
  readonly label: string;
  /** How values are written; plain numbers in the locale by default. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** The bars' colour; the first step of the accent ramp by default. */
  readonly color?: ChartColor | undefined;
  /** Shows each step's share of the step before; on by default. */
  readonly showConversion?: boolean | undefined;
  /** Orders the categories: largest first, smallest first, or by label; the rows' own order by default. */
  readonly sort?: ChartSort | undefined;
}
