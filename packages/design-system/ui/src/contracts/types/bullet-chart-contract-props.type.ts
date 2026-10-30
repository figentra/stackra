/**
 * Stackra file contract:
 * Purpose: `BulletChartContractProps`, the props of every runtime's `BulletChart`: one row per measure with its value
 *          bar, target tick and qualitative bands, a compact stand-in for a gauge.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";
import type { BulletItem } from "#contracts/types/bullet-item.type";

/** Props shared by the web and native `BulletChart`. */
export interface BulletChartContractProps {
  /** The measures, one row each, top to bottom. */
  readonly items: readonly BulletItem[];
  /** The chart's accessible name and the data table's caption, such as "Quarter targets". */
  readonly label: string;
  /** How values are written. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** The value bars' colour; the first step of the accent ramp by default. */
  readonly color?: ChartColor | undefined;
}
