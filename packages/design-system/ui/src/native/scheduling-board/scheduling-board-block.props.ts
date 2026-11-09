/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardBlockProps`, the props of the native SchedulingBoard's internal block: the placed item and
 *          its row, the column width and reading direction, where its row sits among the rows, and the callbacks that
 *          report a drag's draft and a press.
 * Boundary: types only; internal.
 * Runtime: react-native
 * Governing contract: ADR 0305 (one declaration per file); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingBoardContractProps } from "#contracts/types/scheduling-board-contract-props.type";
import type { SchedulingBoardDraft } from "#contracts/types/scheduling-board-draft.type";
import type { SchedulingBoardResource } from "#contracts/types/scheduling-board-resource.type";
import type { PlacedSchedulingItem } from "#core/types/placed-scheduling-item.type";
import type { SchedulingBoardState } from "#core/types/scheduling-board-state.type";

/** Props of one block. */
export type SchedulingBoardBlockProps = Pick<
  SchedulingBoardContractProps,
  "onItemPress" | "renderItem"
> & {
  /** The shared state. */
  readonly state: SchedulingBoardState;
  /** The item as placed on this row. */
  readonly placed: PlacedSchedulingItem;
  /** The row it is drawn on. */
  readonly resource: SchedulingBoardResource;
  /** The row's parents' ids, nearest first, for an inherited item's words. */
  readonly ancestors: readonly string[];
  /** A column's width in points. */
  readonly width: number;
  /** 1 when columns run left to right, -1 in right-to-left, so a finger's movement reads as time. */
  readonly sign: 1 | -1;
  /** True for the first resource row: no "move up". */
  readonly isFirstRow: boolean;
  /** True for the last resource row: no "move down". */
  readonly isLastRow: boolean;
  /** True while this block is being dragged; the preview is drawn where it would land. */
  readonly isDragging: boolean;
  /** Reports a drag's would-be result, or null when it ends. */
  readonly onDraft: (draft: SchedulingBoardDraft | null) => void;
  /** How many resource rows a vertical movement of `dy` points crosses from a row. */
  readonly rowStepsOf: (resourceId: string, dy: number) => number;
};
