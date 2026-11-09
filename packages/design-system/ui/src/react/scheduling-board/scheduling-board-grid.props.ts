/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardGridProps`, the props of the web SchedulingBoard's grid: the shared state, its name, the
 *          time zone and locale, whether empty slots select, and the press and content callbacks.
 * Boundary: types only; internal.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { ReactNode } from "react";

import type { SchedulingBoardItem } from "#contracts/types/scheduling-board-item.type";
import type { SchedulingBoardState } from "#core/types/scheduling-board-state.type";

/** Props of the grid. */
export interface SchedulingBoardGridProps {
  /** The shared state. */
  readonly state: SchedulingBoardState;
  /** The grid's spoken name. */
  readonly label: string;
  /** The IANA time zone the columns are read in, for the hour labels. */
  readonly timeZone: string;
  /** The BCP 47 locale, for the words announced while dragging. */
  readonly locale: string;
  /** True when an empty slot is a button that selects. */
  readonly selectable: boolean;
  /** Called when an item is pressed. */
  readonly onItemPress?: ((item: SchedulingBoardItem) => void) | undefined;
  /** A block's content; the default when left out. */
  readonly renderItem?: ((item: SchedulingBoardItem) => ReactNode) | undefined;
}
