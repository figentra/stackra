/**
 * Stackra file contract:
 * Purpose: `CalendarHeatmapContractProps`, the props the web and native `CalendarHeatmap` share: one cell per day,
 *          a column per week, shaded by the day's value, as in an activity graph.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";
import type { CalendarValue } from "#contracts/types/calendar-value.type";

/** Props shared by the web and native `CalendarHeatmap`. */
export interface CalendarHeatmapContractProps {
  /** The days' values; days without one stay empty. */
  readonly values: readonly CalendarValue[];
  /** The first day shown (`YYYY-MM-DD`); the earliest value's day by default. */
  readonly start?: string | undefined;
  /** The last day shown; the latest value's day by default. */
  readonly end?: string | undefined;
  /** The chart's accessible name, such as "Orders per day, this year". */
  readonly label: string;
  /** How values are written; plain numbers in the locale by default. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** The colour the shades are mixed from; the first step of the accent ramp by default. */
  readonly color?: ChartColor | undefined;
  /** The first day of each week column, 0 (Sunday) to 6 (Saturday); the locale's by default. */
  readonly weekStart?: number | undefined;
  /** Shows the "Less … More" scale; on by default. */
  readonly showLegend?: boolean | undefined;
}
