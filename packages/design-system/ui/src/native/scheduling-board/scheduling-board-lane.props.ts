/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardLaneProps`, the props of the native SchedulingBoard's internal lane: one resource row's
 *          time area with its shading, items, empty slots, the drag preview and the now line.
 * Boundary: types only; internal.
 * Runtime: react-native
 * Governing contract: ADR 0305 (one declaration per file); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingBoardContractProps } from "#contracts/types/scheduling-board-contract-props.type";
import type { SchedulingBoardConflict } from "#contracts/types/scheduling-board-conflict.type";
import type { SchedulingBoardDraft } from "#contracts/types/scheduling-board-draft.type";
import type { SchedulingBoardResource } from "#contracts/types/scheduling-board-resource.type";
import type { SchedulingBoardState } from "#core/types/scheduling-board-state.type";
import type { SchedulingSpan } from "#core/types/scheduling-span.type";

/** Props of one lane. */
export type SchedulingBoardLaneProps = Pick<
  SchedulingBoardContractProps,
  "onItemPress" | "renderItem"
> & {
  /** The shared state. */
  readonly state: SchedulingBoardState;
  /** The row. */
  readonly resource: SchedulingBoardResource;
  /** Its parents' ids, nearest first; their items show here, faded. */
  readonly ancestors: readonly string[];
  /** A column's width in points. */
  readonly width: number;
  /** 1 when columns run left to right, -1 in right-to-left. */
  readonly sign: 1 | -1;
  /** True for the first resource row. */
  readonly isFirstRow: boolean;
  /** True for the last resource row. */
  readonly isLastRow: boolean;
  /** True to make each empty slot a button that selects a range. */
  readonly canSelect: boolean;
  /** The days shaded as rest days or holidays, in columns. */
  readonly dayShade: readonly SchedulingSpan[];
  /** The drag in progress anywhere on the board, or null. */
  readonly draft: SchedulingBoardDraft | null;
  /** The conflicts at the drag in progress, for the preview's colour. */
  readonly conflicts: readonly SchedulingBoardConflict[];
  /** Reports a drag's would-be result, or null when it ends. */
  readonly onDraft: (draft: SchedulingBoardDraft | null) => void;
  /** How many resource rows a vertical movement of `dy` points crosses from a row. */
  readonly rowStepsOf: (resourceId: string, dy: number) => number;
};
