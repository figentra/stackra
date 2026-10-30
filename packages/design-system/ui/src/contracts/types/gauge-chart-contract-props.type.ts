/**
 * Stackra file contract:
 * Purpose: `GaugeChartContractProps`, the props the web and native `GaugeChart` share: a value on a three-quarter ring
 *          against a target, with the figure and a word in the middle.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";

/** Props shared by the web and native `GaugeChart`. */
export interface GaugeChartContractProps {
  readonly value: number;
  /** The ring's start; 0 by default. */
  readonly min?: number | undefined;
  /** The ring's end; 100 by default. */
  readonly max?: number | undefined;
  /** A mark across the ring where the goal is. */
  readonly target?: number | undefined;
  /** The gauge's accessible name, such as "Monthly sales target". */
  readonly label: string;
  /** A word under the figure in the middle, such as "of target". */
  readonly centerLabel?: string | undefined;
  /** How the value and target are written. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** The value arc's colour; the first step of the accent ramp by default. */
  readonly color?: ChartColor | undefined;
  /** The gauge's width and height in pixels; 200 by default. */
  readonly size?: number | undefined;
}
