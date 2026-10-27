/**
 * Stackra file contract:
 * Purpose: the web `FloorPlanEditor`: one area's floor plan on a grid of cells, its tables (rectangular or round,
 *          with their seat counts), walls and labels placed by cell; an item is dragged to move it and its
 *          inline-end bottom corner is dragged to resize it, both snapped to whole cells and kept inside the plan.
 * Boundary: proposes, never saves: a finished drag or key press calls `onItemChange` with the item as it would be,
 *           and the caller saves or refuses it; adding, removing and editing seats or labels is the caller's form.
 *           Keyboard: each item is a button that selects it on focus; arrows move it a cell, with Shift they resize
 *           it, and left and right follow the reading direction. The zoom is the caller's `cellSize`. HeroUI Pro has
 *           no floor plan, so this is the package's own component on its own markup.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 2.1.1 and 2.5.7 (a keyboard way for every drag).
 */
import { useId, useState, type KeyboardEvent, type PointerEvent, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import type { FloorItem } from "#contracts/types/floor-item.type";
import { FLOOR_SHAPE_CLASS } from "#core/constants/floor-shape-class.constant";
import { UI_PRO_KEYS } from "#core/constants/ui-pro-keys.constant";
import { moveFloorItem } from "#core/functions/move-floor-item.function";
import { resizeFloorItem } from "#core/functions/resize-floor-item.function";
import type { FloorPlanEditorProps } from "#react/floor-plan-editor/floor-plan-editor.props";
import { useUiProText } from "#react/hooks/use-ui-pro-text";

/** A drag in progress. */
interface Drag {
  readonly id: string;
  readonly mode: "move" | "resize";
  readonly x: number;
  readonly y: number;
  readonly preview: FloorItem;
}

/** The arrow keys, as cells across (in reading order) and down. */
const ARROWS: Readonly<Record<string, readonly [number, number]>> = Object.freeze({
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
});

/** One area's floor plan, editable by drag and by keyboard. */
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
  const hintId = useId();
  const { direction } = useLocale();
  const sign = direction === "rtl" ? -1 : 1;
  const [drag, setDrag] = useState<Drag | null>(null);
  const bounds = { columns, rows };
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

  const begin = (item: FloorItem, mode: Drag["mode"], pointer: PointerEvent<HTMLElement>): void => {
    onSelectionChange?.(item.id);
    if (!movable(item)) return;
    pointer.stopPropagation();
    pointer.currentTarget.setPointerCapture?.(pointer.pointerId);
    setDrag({ id: item.id, mode, x: pointer.clientX, y: pointer.clientY, preview: item });
  };

  const follow = (item: FloorItem, pointer: PointerEvent<HTMLElement>): void => {
    if (drag?.id !== item.id) return;
    const dx = ((pointer.clientX - drag.x) / cellSize) * sign;
    const dy = (pointer.clientY - drag.y) / cellSize;
    const preview =
      drag.mode === "move"
        ? moveFloorItem(item, dx, dy, bounds)
        : resizeFloorItem(item, dx, dy, bounds);
    setDrag({ ...drag, preview });
  };

  const finish = (item: FloorItem): void => {
    if (drag?.id !== item.id) return;
    propose(item, drag.preview);
    setDrag(null);
  };

  const press = (item: FloorItem, key: KeyboardEvent<HTMLElement>): void => {
    const arrow = ARROWS[key.key];
    if (arrow === undefined || !movable(item)) return;
    key.preventDefault();
    const [across, down] = [arrow[0] * sign, arrow[1]];
    propose(
      item,
      key.shiftKey
        ? resizeFloorItem(item, across, down, bounds)
        : moveFloorItem(item, across, down, bounds),
    );
  };

  return (
    <div
      data-slot="floor-plan-editor"
      role="group"
      aria-label={label}
      className="relative overflow-hidden rounded-lg border border-separator bg-surface-secondary"
      style={{ width: columns * cellSize, height: rows * cellSize }}
    >
      <p id={hintId} className="sr-only">
        {keyboardHint}
      </p>
      {items.map((original) => {
        const item = drag?.id === original.id ? drag.preview : original;
        const seats =
          item.seats === undefined
            ? ""
            : `, ${t(UI_PRO_KEYS.ui_pro.floor_plan.seats, { count: item.seats })}`;
        return (
          <button
            key={item.id}
            type="button"
            data-item={item.id}
            data-shape={item.shape}
            data-dragging={drag?.id === item.id || undefined}
            aria-label={`${item.label}${seats}`}
            aria-describedby={hintId}
            aria-pressed={selectedId === item.id}
            aria-disabled={!movable(original) || undefined}
            className={`absolute flex touch-none items-center justify-center overflow-hidden text-xs ${FLOOR_SHAPE_CLASS[item.shape]} ${selectedId === item.id ? "ring-2 ring-accent" : ""}`}
            style={{
              insetInlineStart: item.x * cellSize,
              top: item.y * cellSize,
              width: item.width * cellSize,
              height: item.height * cellSize,
            }}
            onFocus={() => onSelectionChange?.(original.id)}
            onPointerDown={(pointer) => begin(original, "move", pointer)}
            onPointerMove={(pointer) => follow(original, pointer)}
            onPointerUp={() => finish(original)}
            onPointerCancel={() => setDrag(null)}
            onKeyDown={(key) => press(original, key)}
          >
            {item.shape === "wall" ? null : <span className="truncate px-1">{item.label}</span>}
            {movable(original) ? (
              <span
                data-slot="resize-handle"
                aria-hidden="true"
                className="absolute end-0 bottom-0 size-2 cursor-nwse-resize"
                onPointerDown={(pointer) => begin(original, "resize", pointer)}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
