/**
 * Stackra file contract:
 * Purpose: the props of the `FloorPlanEditor`: the plan's grid, its items, the zoom as the size of one cell, the
 *          selected item, and the handlers a move, a resize or a selection reports to.
 * Boundary: types only. The editor proposes; the caller saves or refuses a change, and adds, removes or edits an
 *           item's seats and label in its own form. One editor shows one area (main hall, terrace).
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 2.1.1 and 2.5.7 (a keyboard way for every drag).
 */
import type { FloorItem } from "#contracts/types/floor-item.type";

/** Props of the `FloorPlanEditor`. */
export interface FloorPlanEditorContractProps {
  /** The plan's name for screen readers (`Main hall`). */
  readonly label: string;
  /** The plan's width, in cells. */
  readonly columns: number;
  /** The plan's height, in cells. */
  readonly rows: number;
  /** The size of one cell in pixels (points on native): the zoom. */
  readonly cellSize?: number | undefined;
  /** The tables, walls and labels. */
  readonly items: readonly FloorItem[];
  /** The selected item's id. */
  readonly selectedId?: string | undefined;
  /** Called with the id of the item pressed or focused. */
  readonly onSelectionChange?: ((id: string) => void) | undefined;
  /** Called with the item as it would be after a move or a resize. */
  readonly onItemChange?: ((item: FloorItem) => void) | undefined;
  /** The keyboard help read with every item. */
  readonly keyboardHint: string;
}
