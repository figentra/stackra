/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardRowProps`, the props of one resource row of the web SchedulingBoard: the laid-out row, the
 *          shared state and input, each column's leading edge, whether empty slots can be selected, and the content
 *          callback.
 * Boundary: types only; internal.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { ReactNode } from "react";

import type { SchedulingBoardItem } from "#contracts/types/scheduling-board-item.type";
import type { SchedulingBoardState } from "#core/types/scheduling-board-state.type";
import type { SchedulingBoardInput } from "#react/scheduling-board/scheduling-board-input.type";
import type { SchedulingBoardLane } from "#react/scheduling-board/scheduling-board-lane.type";

/** Props of one resource row. */
export interface SchedulingBoardRowProps {
  /** The row, laid out. */
  readonly lane: SchedulingBoardLane;
  /** The shared state. */
  readonly state: SchedulingBoardState;
  /** The grid's input, without the grid's own callback ref. */
  readonly input: Omit<SchedulingBoardInput, "attach">;
  /** Each column's leading edge: a day's border, an hour's lighter one, or none. */
  readonly edges: readonly ("day" | "hour" | "none")[];
  /** True when an empty slot is a button that selects. */
  readonly selectable: boolean;
  /** A block's content; the default when left out. */
  readonly renderItem?: ((item: SchedulingBoardItem) => ReactNode) | undefined;
}
