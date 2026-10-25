/**
 * Stackra file contract:
 * Purpose: `SlotQuery`, what `findSlots` searches: the open windows (working hours or a resource's availability), the
 *          busy blocks, the booking's segments, the step between candidate starts and an optional limit.
 * Boundary: a type only. Candidate starts step from the start of each open window.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 7).
 */
import type { Interval } from "#core/types/interval.type";
import type { Segment } from "#core/types/segment.type";

/** The input of `findSlots`. */
export interface SlotQuery {
  /** When the resource can work. */
  readonly open: readonly Interval[];

  /** When it is already taken. */
  readonly busy: readonly Interval[];

  /** The booking, in order. */
  readonly segments: readonly Segment[];

  /** Minutes between candidate starts. */
  readonly step: number;

  /** The most slots to return; all when absent. */
  readonly limit?: number;
}
