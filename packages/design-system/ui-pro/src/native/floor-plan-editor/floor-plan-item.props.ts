/**
 * Stackra file contract:
 * Purpose: `FloorPlanItemProps`, props of one item of the native `FloorPlanEditor`: the item as drawn, its cell size,
 *          its name and hint, its action labels, and the handlers that report drags, drops and actions.
 * Boundary: internal; a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3).
 */
import type { FloorItem } from "#contracts/types/floor-item.type";
import type { FloorPlanItemAction } from "#native/floor-plan-editor/floor-plan-item-action.type";

/** Props of one floor-plan item. */
export interface FloorPlanItemProps {
  /** The item as drawn (the drag preview while dragging). */
  readonly item: FloorItem;
  /** The size of one cell, in points. */
  readonly cellSize: number;
  /** Whether it is selected. */
  readonly isSelected: boolean;
  /** Whether it may be moved or resized. */
  readonly isMovable: boolean;
  /** Its full name for screen readers. */
  readonly label: string;
  /** The help read with it. */
  readonly hint: string;
  /** The words of each action. */
  readonly actionLabels: Readonly<Record<FloorPlanItemAction, string>>;
  /** Called when pressed. */
  readonly onSelect: () => void;
  /** Called while a finger drags, with the distance in points. */
  readonly onDrag: (mode: "move" | "resize", dx: number, dy: number) => void;
  /** Called when the finger lifts, with the distance in points. */
  readonly onDrop: (mode: "move" | "resize", dx: number, dy: number) => void;
  /** Called when the system takes the gesture away. */
  readonly onCancel: () => void;
  /** Called with a screen-reader action. */
  readonly onAction: (action: FloorPlanItemAction) => void;
}
