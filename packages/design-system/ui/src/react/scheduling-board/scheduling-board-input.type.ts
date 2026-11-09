/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardInput`, what `useSchedulingBoardInput` gives the web SchedulingBoard's grid: the drag in
 *          progress, the one focus stop Tab reaches, each stop's key, the presses, and the handlers the grid spreads.
 * Boundary: types only; internal to the web SchedulingBoard.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { FocusEvent, KeyboardEvent, PointerEvent } from "react";

import type { SchedulingBoardItem } from "#contracts/types/scheduling-board-item.type";
import type { SchedulingBoardDrag } from "#react/scheduling-board/scheduling-board-drag.type";

/** The grid's input state and handlers. */
export interface SchedulingBoardInput {
  /** The drag in progress, or null. */
  readonly drag: SchedulingBoardDrag | null;
  /** The key of the stop that takes `tabIndex` 0. */
  readonly tabKey: string;
  /** The grid's callback ref: the element where stops are looked up to be focused. */
  readonly attach: (element: HTMLDivElement | null) => void;
  /** The key of an empty slot's stop. */
  readonly cellKey: (resourceId: string, column: number) => string;
  /** The key of a block's stop on a row. */
  readonly blockKey: (resourceId: string, itemId: string) => string;
  /** A click on an empty slot: selects that one slot. */
  readonly pressSlot: (resourceId: string, column: number) => void;
  /** A click on a block: presses it, unless it ends a drag. */
  readonly pressItem: (item: SchedulingBoardItem) => void;
  /** Arrows, Home, End, Enter, Escape and `m` on the grid's stops. */
  readonly onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  /** Starts a range, move or resize drag. */
  readonly onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  /** Keeps the focused stop as the one Tab returns to. */
  readonly onFocus: (event: FocusEvent<HTMLElement>) => void;
  /** Cancels a keyboard drag when focus leaves the grid. */
  readonly onBlur: (event: FocusEvent<HTMLElement>) => void;
}
