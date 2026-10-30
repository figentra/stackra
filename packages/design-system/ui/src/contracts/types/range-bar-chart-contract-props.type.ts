/**
 * Stackra file contract:
 * Purpose: `RangeBarChartContractProps`, the props of every runtime's `RangeBarChart`: floating bars from a low to a
 *          high value per category, such as a day's lowest and highest temperature or a price band.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";
import type { Orientation } from "#contracts/enums/orientation.enum";
import type { ChartDatum } from "#contracts/types/chart-datum.type";
import type { ChartEmphasis } from "#contracts/types/chart-emphasis.type";

/** Props shared by the web and native `RangeBarChart`. */
export interface RangeBarChartContractProps {
  /** The rows, in reading order. */
  readonly data: readonly ChartDatum[];
  /** The key of each row's category. */
  readonly xKey: string;
  /** The key of each row's low end. */
  readonly fromKey: string;
  /** The key of each row's high end. */
  readonly toKey: string;
  /** The chart's accessible name and the data table's caption, such as "Daily temperature range". */
  readonly label: string;
  /** Writes the category as a date in the locale (`{ month: "short" }`); as given without it. */
  readonly xFormat?: Intl.DateTimeFormatOptions | undefined;
  /** How values are written. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** `vertical` bars stand on the category axis (the default); `horizontal` bars lie along it. */
  readonly orientation?: Orientation | undefined;
  /** The bars' colour; the first step of the accent ramp by default. */
  readonly color?: ChartColor | undefined;
  /** Which bar carries the colour while the rest stand back in its soft tone: `none` (the default), `latest` or an index. */
  readonly emphasis?: ChartEmphasis | undefined;
  /** The plot's height in pixels; 240 by default. */
  readonly height?: number | undefined;
  /** Draws the value axis; on by default, since a floating bar is read against it. */
  readonly showValueAxis?: boolean | undefined;
  /** Shows the pointed or pressed row's range; on by default. */
  readonly showTooltip?: boolean | undefined;
}
