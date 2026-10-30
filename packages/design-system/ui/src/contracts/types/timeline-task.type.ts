/**
 * Stackra file contract:
 * Purpose: `TimelineTask`, one bar of a timeline chart: a piece of work from its start date to its end date, in a lane.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";

/** One task on a timeline. */
export interface TimelineTask {
  readonly key: string;
  /** The key of the lane it sits in. */
  readonly rowKey: string;
  readonly label: string;
  /** Its first day, an ISO date (`2026-11-03`). */
  readonly start: string;
  /** Its last day, an ISO date; the bar runs to the end of that day. */
  readonly end: string;
  /** Its theme colour; the first accent step by default. */
  readonly color?: ChartColor | undefined;
}
