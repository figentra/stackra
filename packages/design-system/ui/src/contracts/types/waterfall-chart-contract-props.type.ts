/**
 * Stackra file contract:
 * Purpose: `WaterfallChartContractProps`, the props the web and native `WaterfallChart` share: a bridge from a start
 *          total through rises and falls to the end total.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { WaterfallStep } from "#contracts/types/waterfall-step.type";

/** Props shared by the web and native `WaterfallChart`. */
export interface WaterfallChartContractProps {
  /** The opening total, such as last quarter's profit. */
  readonly start: { readonly label: string; readonly value: number };
  /** The changes, in order. */
  readonly steps: readonly WaterfallStep[];
  /** The closing total's name; its value is the start plus every step. */
  readonly endLabel: string;
  /** The chart's accessible name, such as "Profit, Q3 to Q4". */
  readonly label: string;
  /** How values are written; plain numbers in the locale by default. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** The plot's height in pixels; 240 by default. */
  readonly height?: number | undefined;
  /** Shows the values of the pointed or pressed bar; on by default. */
  readonly showTooltip?: boolean | undefined;
}
