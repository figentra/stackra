/**
 * Stackra file contract:
 * Purpose: `SparklineContractProps`, the props of every runtime's `Sparkline`: a word-sized trend with no axes, legend
 *          or tooltip, for a table cell or a stat tile.
 * Boundary: types only. It is one image named by `label`, its first and last values spoken after the name.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";

/** Props shared by the web and native `Sparkline`. */
export interface SparklineContractProps {
  /** The values, oldest first. */
  readonly data: readonly number[];
  /** The accessible name, such as "Revenue, last 12 weeks". */
  readonly label: string;
  /** `line` (the default), `area` or `bar`. */
  readonly kind?: "line" | "area" | "bar" | undefined;
  /** Its theme colour; `accent` by default. */
  readonly color?: ChartColor | undefined;
  /** How the spoken values are written. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** Its height in pixels; 32 by default. It fills its container's width. */
  readonly height?: number | undefined;
}
