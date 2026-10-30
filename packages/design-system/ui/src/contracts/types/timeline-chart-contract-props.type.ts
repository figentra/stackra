/**
 * Stackra file contract:
 * Purpose: `TimelineChartContractProps`, the props of every runtime's `TimelineChart` (a gantt): the lanes, the tasks,
 *          the name, today's marker and the dates' format.
 * Boundary: types only. Time runs from the reading start: left to right in English, right to left in Arabic.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0060 (right-to-left); STA-1371.
 */
import type { TimelineRow } from "#contracts/types/timeline-row.type";
import type { TimelineTask } from "#contracts/types/timeline-task.type";

/** Props shared by the web and native `TimelineChart`. */
export interface TimelineChartContractProps {
  /** The lanes, top to bottom. */
  readonly rows: readonly TimelineRow[];
  /** The tasks; a lane may hold several, side by side in time. */
  readonly tasks: readonly TimelineTask[];
  /** The chart's accessible name and the data table's caption, such as "Launch plan, Q4". */
  readonly label: string;
  /** Draws a dashed "Today" line on this ISO date when it falls in the span. */
  readonly today?: string | undefined;
  /** How the task dates are written in the table and the readout; `{ day: "numeric", month: "short" }` by default. */
  readonly dateFormat?: Intl.DateTimeFormatOptions | undefined;
}
