/**
 * Stackra file contract:
 * Purpose: `CandlestickChartContractProps`, the props the web and native `CandlestickChart` share: one candle per
 *          period (open, high, low, close) with volume bars along the bottom.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { CandleDatum } from "#contracts/types/candle-datum.type";

/** Props shared by the web and native `CandlestickChart`. */
export interface CandlestickChartContractProps {
  /** The periods, oldest first. */
  readonly data: readonly CandleDatum[];
  /** The chart's accessible name, such as "Share price, last 30 days". */
  readonly label: string;
  /** Writes each period as a date in the locale (`{ month: "short", day: "numeric" }`); as given without it. */
  readonly xFormat?: Intl.DateTimeFormatOptions | undefined;
  /** How prices are written, such as `{ style: "currency", currency: "SAR" }`. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** Draws the volume bars; on by default when any period has a volume. */
  readonly showVolume?: boolean | undefined;
  /** The plot's height in pixels; 280 by default. */
  readonly height?: number | undefined;
  /** Shows the pointed or pressed period's prices; on by default. */
  readonly showTooltip?: boolean | undefined;
}
