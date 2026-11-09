/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardResource`, one row of a SchedulingBoard: a person, room, piece of equipment or delivery
 *          slot, with its capacity, the group its header sits under, and the parent it belongs to (a pitch's half).
 * Boundary: types only; the rows are the caller's, shown in the order given within their group.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingResourceKind } from "#contracts/enums/scheduling-resource-kind.enum";

/** One row of a SchedulingBoard. */
export interface SchedulingBoardResource {
  /** Unique among the resources; items name their rows by it. */
  readonly id: string;
  /** The name at the start of the row. */
  readonly label: string;
  /** What it is; the row's icon follows it. */
  readonly kind?: SchedulingResourceKind | undefined;
  /** How many items may overlap on it before the board warns; 1 by default. */
  readonly capacity?: number | undefined;
  /** The heading it is listed under, for example a branch; rows without one come first. */
  readonly group?: string | undefined;
  /** The resource it is part of: listed under it, indented, and showing its items faded. */
  readonly parentId?: string | undefined;
  /** A picture of a person, shown beside the label. */
  readonly avatarUrl?: string | undefined;
}
