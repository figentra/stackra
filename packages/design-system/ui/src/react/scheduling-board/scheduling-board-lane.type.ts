/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardLane`, one resource row of the web SchedulingBoard as its grid lays it out: the resource,
 *          its depth and parents, its placed items, its shading outside working time, and how many lanes its blocks
 *          need.
 * Boundary: types only; internal to the web SchedulingBoard.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingBoardResource } from "#contracts/types/scheduling-board-resource.type";
import type { PlacedSchedulingItem } from "#core/types/placed-scheduling-item.type";
import type { SchedulingSpan } from "#core/types/scheduling-span.type";

/** One resource row, laid out. */
export interface SchedulingBoardLane {
  /** The resource. */
  readonly resource: SchedulingBoardResource;
  /** How many parents it is under, for the indent. */
  readonly depth: number;
  /** Its parents' ids, nearest first. */
  readonly ancestors: readonly string[];
  /** Its placed items, with pending moves applied. */
  readonly placements: readonly PlacedSchedulingItem[];
  /** Its stretches outside working time. */
  readonly shade: readonly SchedulingSpan[];
  /** The most lanes its blocks share, at least 1; the row grows with it. */
  readonly lanes: number;
}
