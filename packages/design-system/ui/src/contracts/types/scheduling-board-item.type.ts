/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardItem`, one block on a SchedulingBoard: a booking, hold, closure, block or working time,
 *          on one or more rows from its start to its end, with its words, tone, fill and what may be done to it.
 * Boundary: types only; the items are the caller's: the board places them and never edits them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { Tone } from "@stackra/contracts";

import type { SchedulingItemKind } from "#contracts/enums/scheduling-item-kind.enum";
import type { SchedulingBoardFill } from "#contracts/types/scheduling-board-fill.type";

/** One block on a SchedulingBoard. */
export interface SchedulingBoardItem {
  /** Unique among the items; React keys the block by it. */
  readonly id: string;
  /** The rows it sits on; an offering that needs a room and a coach names both. */
  readonly resourceIds: readonly string[];
  /** When it starts. */
  readonly start: Date;
  /** When it ends; after `start`. */
  readonly end: Date;
  /** What it is; working time is drawn behind the lane, a closure across it. */
  readonly kind: SchedulingItemKind;
  /** The words on the block, also its accessible name with its time and row. */
  readonly title: string;
  /** A second line, for example the coach. */
  readonly subtitle?: string | undefined;
  /** The engine's status, for example `confirmed`; read out after the time. */
  readonly status?: string | undefined;
  /** The block's colour; the kind's by default. */
  readonly tone?: Tone | undefined;
  /** True to show it across whole days. */
  readonly allDay?: boolean | undefined;
  /** When a hold lapses; the block counts down to it. */
  readonly expiresAt?: Date | undefined;
  /** Seats taken of seats offered, for a group session. */
  readonly fill?: SchedulingBoardFill | undefined;
  /** False to keep it in place; true by default unless the board is read-only. */
  readonly movable?: boolean | undefined;
  /** False to keep its length; true by default unless the board is read-only. */
  readonly resizable?: boolean | undefined;
}
