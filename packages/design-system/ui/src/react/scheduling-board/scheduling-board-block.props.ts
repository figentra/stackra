/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardBlockProps`, the props of one block of the web SchedulingBoard: its placement and row, the
 *          shared state, its focus stop, whether a drag lifted it, and the press and content callbacks.
 * Boundary: types only; internal.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { ReactNode } from "react";

import type { SchedulingBoardItem } from "#contracts/types/scheduling-board-item.type";
import type { SchedulingBoardResource } from "#contracts/types/scheduling-board-resource.type";
import type { PlacedSchedulingItem } from "#core/types/placed-scheduling-item.type";
import type { SchedulingBoardState } from "#core/types/scheduling-board-state.type";

/** Props of one block. */
export interface SchedulingBoardBlockProps {
  /** The item as placed on this row. */
  readonly placed: PlacedSchedulingItem;
  /** The row's resource, for the spoken name. */
  readonly resource: SchedulingBoardResource;
  /** The row's parents, for an inherited item's "From" words. */
  readonly ancestors: readonly string[];
  /** The shared state. */
  readonly state: SchedulingBoardState;
  /** Its focus stop's key. */
  readonly stopKey: string;
  /** True when it is the one stop Tab reaches. */
  readonly isTabStop: boolean;
  /** True while a drag carries it; it stays behind, dimmed. */
  readonly isLifted: boolean;
  /** Called when it is pressed. */
  readonly onPress: (item: SchedulingBoardItem) => void;
  /** Its content; the title, time, fill and countdown by default. */
  readonly renderItem?: ((item: SchedulingBoardItem) => ReactNode) | undefined;
}
