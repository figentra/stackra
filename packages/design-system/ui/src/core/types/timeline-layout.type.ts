/**
 * Stackra file contract:
 * Purpose: `TimelineLayout`, a laid-out timeline chart: its span, its date ticks and each task as a share of the span
 *          from the reading start (`timelineLayoutOf`).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
import type { TimelineTask } from "#contracts/types/timeline-task.type";

/** The span, ticks, bars and today's place. */
export interface TimelineLayout {
  /** The span's first and last instant, in milliseconds since the epoch (UTC days). */
  readonly from: number;
  readonly to: number;
  /** `month` ticks for a span over about two months, `week` ticks under it. */
  readonly unit: "month" | "week";
  /** Each tick's date and its share of the span, 0 at the start. */
  readonly ticks: readonly { readonly date: number; readonly at: number }[];
  /** Each task's lane, start and length as shares of the span. */
  readonly bars: readonly {
    readonly task: TimelineTask;
    readonly row: number;
    readonly at: number;
    readonly length: number;
  }[];
  /** Today's share of the span, or null when today is not given or falls outside. */
  readonly today: number | null;
}
