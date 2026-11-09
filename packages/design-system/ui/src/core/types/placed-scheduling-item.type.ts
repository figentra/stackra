/**
 * Stackra file contract:
 * Purpose: `PlacedSchedulingItem`, one item as `schedulingPlacementsOf` places it on a row: its start and length in
 *          columns, its layer, its lane among the blocks it overlaps, and whether it is a parent's, shown faded.
 * Boundary: types only; internal to the web and native SchedulingBoard.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingBoardItem } from "#contracts/types/scheduling-board-item.type";

/** An item placed on a row. */
export interface PlacedSchedulingItem {
  /** The item. */
  readonly item: SchedulingBoardItem;
  /** Where it starts, in columns from the first (a fraction inside a column). */
  readonly offset: number;
  /** How many columns it spans. */
  readonly length: number;
  /** `band` (working time, behind), `cover` (a closure, across the row) or `block` (in a lane). */
  readonly layer: "band" | "cover" | "block";
  /** Its lane, 0 first; a band or cover is lane 0 of 1. */
  readonly lane: number;
  /** How many lanes the blocks it overlaps share. */
  readonly lanes: number;
  /** True when it sits on a parent of this row; it is faded and cannot be dragged from here. */
  readonly inherited: boolean;
  /** True when it starts before the first column or in hours not shown. */
  readonly clippedStart: boolean;
  /** True when it ends after the last column or in hours not shown. */
  readonly clippedEnd: boolean;
}
