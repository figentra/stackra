/**
 * Stackra file contract:
 * Purpose: `SchedulingRow`, one row of a SchedulingBoard as `schedulingRowsOf` orders it: a group's heading, or a
 *          resource with its depth under its parents and the ids of those parents.
 * Boundary: types only; internal to the web and native SchedulingBoard.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingBoardResource } from "#contracts/types/scheduling-board-resource.type";

/** One row: a group heading or a resource. */
export type SchedulingRow =
  | {
      /** A group's heading. */
      readonly kind: "group";
      /** The group's name, also its key. */
      readonly group: string;
      /** True when its resources are hidden. */
      readonly collapsed: boolean;
    }
  | {
      /** A resource. */
      readonly kind: "resource";
      /** The resource. */
      readonly resource: SchedulingBoardResource;
      /** How many parents it is under, for the indent. */
      readonly depth: number;
      /** Its parents' ids, nearest first; their items show on it, faded. */
      readonly ancestors: readonly string[];
    };
