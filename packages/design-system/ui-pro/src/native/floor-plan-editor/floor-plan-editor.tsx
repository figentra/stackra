/**
 * Stackra file contract:
 * Purpose: the native `FloorPlanEditor`: one area's floor plan on a grid of cells, its tables (rectangular or round,
 *          with their seat counts), walls and labels placed by cell; a finger drags an item to move it and drags its
 *          inline-end bottom corner to resize it, both snapped to whole cells and kept inside the plan. The web
 *          editor's contract, on React Native.
 * Boundary: proposes, never saves: a finished drag or an action calls `onItemChange` with the item as it would be,
 *           and the caller saves or refuses it; adding, removing and editing seats or labels is the caller's form. The
 *           screen-reader way for every drag is each item's actions (`ui_pro::floor_plan.*`), with `keyboardHint`
 *           read as its hint. In a right-to-left layout a drag to the left moves toward the inline end. The zoom is
 *           the caller's `cellSize`; panning a large plan is the screen's scroll view.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 2.5.7 (a single-pointer way for every drag).
 */
import { useState, type ReactElement } from "react";
import { I18nManager, View } from "react-native";

import type { FloorItem } from "#contracts/types/floor-item.type";
import { UI_PRO_KEYS } from "#core/constants/ui-pro-keys.constant";
import { moveFloorItem } from "#core/functions/move-floor-item.function";
import { resizeFloorItem } from "#core/functions/resize-floor-item.function";
import type { FloorPlanEditorProps } from "#native/floor-plan-editor/floor-plan-editor.props";
import { FloorPlanItem } from "#native/floor-plan-editor/floor-plan-item";
import type { FloorPlanItemAction } from "#native/floor-plan-editor/floor-plan-item-action.type";
import { useUiProText } from "#native/hooks/use-ui-pro-text";

/** Each action as cells across (toward the inline end) and down, and whether it resizes. */
const STEPS: Readonly<Record<FloorPlanItemAction, readonly [number, number, boolean]>> =
  Object.freeze({
    move_up: [0, -1, false],
    move_down: [0, 1, false],
    move_start: [-1, 0, false],
    move_end: [1, 0, false],
    widen: [1, 0, true],
    narrow: [-1, 0, true],
    taller: [0, 1, true],
    shorter: [0, -1, true],
  });

/** One area's floor plan, editable by drag and by screen-reader actions. */
export function FloorPlanEditor({
  label,
  columns,
  rows,
  cellSize = 32,
  items,
  selectedId,
  onSelectionChange,
  onItemChange,
  keyboardHint,
}: FloorPlanEditorProps): ReactElement {
  const t = useUiProText();
  const [preview, setPreview] = useState<FloorItem | null>(null);
  const bounds = { columns, rows };
  const sign = I18nManager.isRTL ? -1 : 1;
  const keys = UI_PRO_KEYS.ui_pro.floor_plan;
  const actionLabels: Readonly<Record<FloorPlanItemAction, string>> = {
    move_up: t(keys.move_up),
    move_down: t(keys.move_down),
    move_start: t(keys.move_start),
    move_end: t(keys.move_end),
    widen: t(keys.widen),
    narrow: t(keys.narrow),
    taller: t(keys.taller),
    shorter: t(keys.shorter),
  };
  const movable = (item: FloorItem): boolean =>
    onItemChange !== undefined && item.isMovable !== false;

  const propose = (before: FloorItem, after: FloorItem): void => {
    if (
      after.x !== before.x ||
      after.y !== before.y ||
      after.width !== before.width ||
      after.height !== before.height
    )
      onItemChange?.(after);
  };

  /** The item a drag of `dx` and `dy` points would make. */
  const dragged = (item: FloorItem, mode: "move" | "resize", dx: number, dy: number): FloorItem =>
    mode === "move"
      ? moveFloorItem(item, (dx / cellSize) * sign, dy / cellSize, bounds)
      : resizeFloorItem(item, (dx / cellSize) * sign, dy / cellSize, bounds);

  return (
    <View
      testID="floor-plan-editor"
      accessibilityLabel={label}
      className="relative overflow-hidden rounded-lg border border-separator bg-surface-secondary"
      style={{ width: columns * cellSize, height: rows * cellSize }}
    >
      {items.map((original) => {
        const item = preview?.id === original.id ? preview : original;
        const seats = item.seats === undefined ? "" : `, ${t(keys.seats, { count: item.seats })}`;
        return (
          <FloorPlanItem
            key={item.id}
            item={item}
            cellSize={cellSize}
            isSelected={selectedId === item.id}
            isMovable={movable(original)}
            label={`${item.label}${seats}`}
            hint={keyboardHint}
            actionLabels={actionLabels}
            onSelect={() => onSelectionChange?.(original.id)}
            onDrag={(mode, dx, dy) => setPreview(dragged(original, mode, dx, dy))}
            onDrop={(mode, dx, dy) => {
              setPreview(null);
              propose(original, dragged(original, mode, dx, dy));
            }}
            onCancel={() => setPreview(null)}
            onAction={(action) => {
              const [across, down, isResize] = STEPS[action];
              propose(
                original,
                isResize
                  ? resizeFloorItem(original, across, down, bounds)
                  : moveFloorItem(original, across, down, bounds),
              );
            }}
          />
        );
      })}
    </View>
  );
}
