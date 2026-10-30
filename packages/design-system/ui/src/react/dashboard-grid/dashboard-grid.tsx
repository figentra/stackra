/**
 * Stackra file contract:
 * Purpose: the web `DashboardGrid`: a dashboard's tiles in a responsive 12-column grid (full width on a phone, each
 *          tile's share of 12 from `md`). In edit mode a slim toolbar sits above each tile's end corner with a drag handle,
 *          "Move earlier", "Move later" and a size button that steps small, medium, large, full, and a handle on the
 *          tile's inline-end edge resizes it by pointer, snapping between the four sizes; tiles are dragged with React
 *          Aria's drag and drop (pointer, or keyboard and screen reader on the handle). The layout is the caller's, or
 *          kept through a `DashboardLayoutPort`.
 * Boundary: presents only: a move or resize calls `onLayoutChange` with the whole new layout. Button moves and resizes
 *           are announced in a polite live region and keep focus on the pressed control; drags use React Aria's own
 *           announcements. Tiles spring to their new place with `motion`'s layout animation, off under
 *           prefers-reduced-motion. "Earlier" and "later" follow the reading order, so the grid needs nothing extra
 *           for right to left; the resize handle sits on the inline end and reads pointer travel mirrored there. The
 *           edit chrome carries no title and draws no frame around the tile, which brings its own; outside edit mode
 *           a tile adds nothing and the grid is a plain group.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decisions 16 and 18); ADR 0329 (motion layer); ADR 0060
 *          (right-to-left); WCAG 2.2 SC 2.1.1, 2.5.7, 4.1.2 and 4.1.3; STA-1371.
 */
import { cn } from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";
import { type PointerEvent, type ReactElement, useEffect, useRef, useState } from "react";
import {
  Button as AriaButton,
  DropIndicator,
  GridList,
  GridListItem,
  useDragAndDrop,
} from "react-aria-components";

import { WidgetSize } from "#contracts/enums/widget-size.enum";
import type { DashboardLayout } from "#contracts/types/dashboard-layout.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { moveItem } from "#core/functions/move-item.function";
import { reorderItems } from "#core/functions/reorder-items.function";
import { widgetSizeOfColumns } from "#core/functions/widget-size-of-columns.function";
import { DASHBOARD_SPAN } from "#react/dashboard-grid/dashboard-span.constant";
import type { DashboardGridProps } from "#react/dashboard-grid/dashboard-grid.props";
import { useDashboardLayout } from "#react/hooks/use-dashboard-layout";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";

/** The spring a tile settles with after a move. */
const SETTLE = { type: "spring", stiffness: 500, damping: 38 } as const;

/** The default for an unset layout: one stable empty list. */
const NONE: DashboardLayout = [];

/** The keys of the words. */
const K = UI_KEYS.ui.dashboard_grid;

/** A tile control's look: a 32px target, quiet until hovered or focused. */
const CONTROL =
  "inline-flex min-h-8 min-w-8 items-center justify-center gap-1 rounded-[var(--radius-control)] px-1.5 text-sm text-muted outline-none hover:bg-default hover:text-foreground focus-visible:outline-2 focus-visible:outline-focus data-[disabled]:opacity-40";

/** A grid of dashboard tiles the reader can reorder and resize. */
export function DashboardGrid({
  label,
  renderTile,
  tileLabel,
  layout,
  defaultLayout = NONE,
  onLayoutChange,
  layoutPort,
  isEditing = false,
  className,
}: DashboardGridProps): ReactElement {
  const t = useUiText();
  const isReduced = useReducedMotion() ?? false;
  const [own, setOwn] = useDashboardLayout(layoutPort, defaultLayout);
  const tiles = layout ?? own;
  const [message, setMessage] = useState("");
  // The control to focus again once the moved tile has been drawn in its new place.
  const refocus = useRef<{ id: string; action: string } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const sizeName = (size: WidgetSize) => t(K[`size_${size}`]);
  // The size a tile shows while its resize handle is dragged, before it is committed on release.
  const [sizing, setSizing] = useState<{ id: string; size: WidgetSize } | null>(null);
  const sizeOf = (tile: DashboardLayout[number]) =>
    sizing?.id === tile.id ? sizing.size : tile.size;
  const resizing = useRef<{
    id: string;
    x: number;
    column: number;
    span: number;
    sign: number;
    size?: WidgetSize;
  } | null>(null);

  const change = (next: DashboardLayout) => {
    if (layout === undefined) setOwn(next);
    onLayoutChange?.(next);
  };
  const move = (from: number, to: number) => {
    const tile = tiles[from];
    if (!tile || to < 0 || to >= tiles.length) return;
    change(moveItem(tiles, from, to));
    setMessage(t(K.moved, { label: tileLabel(tile.id), position: to + 1, count: tiles.length }));
  };
  const resize = (index: number) => {
    const tile = tiles[index];
    if (!tile) return;
    const size = WidgetSize[(WidgetSize.indexOf(tile.size) + 1) % WidgetSize.length] ?? "medium";
    change(tiles.map((other, at) => (at === index ? { ...other, size } : other)));
    setMessage(t(K.resized, { label: tileLabel(tile.id), size: sizeName(size) }));
  };

  // Dragging the inline-end edge: each column's width of travel adds or takes a column, snapped to a size.
  const startResize = (event: PointerEvent<HTMLElement>, tile: DashboardLayout[number]) => {
    const grid = event.currentTarget.closest('[role="grid"]');
    if (!grid || event.button !== 0) return;
    // Kept from the grid list, so a resize never starts a drag or a selection.
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizing.current = {
      id: tile.id,
      x: event.clientX,
      column: grid.getBoundingClientRect().width / 12,
      span: (WidgetSize.indexOf(tile.size) + 1) * 3,
      sign: getComputedStyle(grid).direction === "rtl" ? -1 : 1,
    };
  };
  const dragResize = (event: PointerEvent<HTMLElement>) => {
    const drag = resizing.current;
    if (!drag) return;
    const columns = drag.span + (drag.sign * (event.clientX - drag.x)) / drag.column;
    const size = widgetSizeOfColumns(columns);
    // Kept on the drag as well: the release handler may come from a render before this size was drawn.
    drag.size = size;
    setSizing({ id: drag.id, size });
  };
  const endResize = () => {
    const drag = resizing.current;
    resizing.current = null;
    setSizing(null);
    const index = tiles.findIndex((tile) => tile.id === drag?.id);
    const tile = tiles[index];
    const size = drag?.size;
    if (!tile || !size || size === tile.size) return;
    change(tiles.map((other, at) => (at === index ? { ...other, size } : other)));
    setMessage(t(K.resized, { label: tileLabel(tile.id), size: sizeName(size) }));
  };

  // After every render: a pressed control whose tile moved is focused again in its new place.
  useEffect(() => {
    const pending = refocus.current;
    if (!pending) return;
    refocus.current = null;
    const scope = gridRef.current?.querySelector(`[data-tile-id="${CSS.escape(pending.id)}"]`);
    scope?.querySelector<HTMLElement>(`[data-action="${pending.action}"]`)?.focus();
  });

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ "text/plain": tileLabel(String(key)) })),
    onReorder: ({ keys, target }) => {
      const next = reorderItems(tiles, keys, target.key, target.dropPosition);
      if (next !== tiles) change(next);
    },
    // A line across the grid where the tile will land; hidden, so it takes no row, until it is the target.
    renderDropIndicator: (target) => (
      <DropIndicator
        target={target}
        className="col-span-12 hidden h-1 rounded-[var(--radius-pill)] bg-accent data-[drop-target]:block"
      />
    ),
    renderDragPreview: (dragged) => (
      <div
        className="scale-[1.02] bg-overlay px-4 py-3 text-foreground shadow-overlay"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        {dragged[0]?.["text/plain"]}
      </div>
    ),
  });

  const grid = cn("grid grid-cols-12 gap-4", className) ?? "";
  const live = (
    <div aria-live="polite" className="sr-only">
      {message}
    </div>
  );

  if (!isEditing)
    return (
      // The tiles span by the grid's own width (DASHBOARD_SPAN), so a dashboard in a narrow panel stacks its tiles
      // instead of squeezing four into a row, where the KPIs' nested container queries also stalled layout for seconds.
      <div className="@container">
        <div role="group" aria-label={label} className={grid}>
          {tiles.map((tile) => (
            <motion.div
              key={tile.id}
              layout={!isReduced}
              transition={SETTLE}
              data-tile-id={tile.id}
              className={cn(DASHBOARD_SPAN[tile.size], "min-w-0")}
            >
              {renderTile(tile.id)}
            </motion.div>
          ))}
          {live}
        </div>
      </div>
    );

  return (
    <div ref={gridRef} className="@container">
      <GridList
        aria-label={label}
        items={tiles}
        // React Aria caches each item's render by the item; a move changes positions, not items, so re-render on order.
        dependencies={[tiles, renderTile, tileLabel, sizing]}
        layout="grid"
        keyboardNavigationBehavior="tab"
        dragAndDropHooks={dragAndDropHooks}
        // Room above every row for its tiles' toolbars, so they cover none of the tile's own content.
        className={cn(grid, "gap-y-12 pt-10") ?? ""}
      >
        {(tile) => {
          const index = tiles.findIndex((other) => other.id === tile.id);
          const name = tileLabel(tile.id);
          const size = sizeOf(tile);
          // A move that takes the tile to the end its control points at turns that control off, so focus goes to
          // the drag handle. Decided here from the new index: the grid may not have drawn the control off yet.
          const press = (action: string, run: () => void) => () => {
            const isOff =
              (action === "earlier" && index - 1 <= 0) ||
              (action === "later" && index + 1 >= tiles.length - 1);
            refocus.current = { id: tile.id, action: isOff ? "drag" : action };
            run();
          };
          return (
            <GridListItem
              id={tile.id}
              textValue={name}
              data-tile-id={tile.id}
              className={
                cn(
                  DASHBOARD_SPAN[size],
                  "relative min-w-0 rounded-[var(--radius-container)] outline-none data-[dragging]:opacity-40",
                  "data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 data-[focus-visible]:outline-focus",
                ) ?? ""
              }
            >
              <motion.div layout={!isReduced} transition={SETTLE} className="h-full">
                {/* A slim toolbar attached above the tile's inline-end corner: no title and no frame around the tile,
                    its controls named by the tile. */}
                <div className="absolute bottom-full end-0 z-10 mb-1.5 flex items-center gap-0.5 rounded-[var(--radius-control)] bg-overlay p-0.5 shadow-overlay">
                  <AriaButton
                    slot="drag"
                    data-action="drag"
                    aria-label={t(K.handle, { label: name })}
                    className={cn(CONTROL, "cursor-grab") ?? ""}
                  >
                    <Icon name="grip-vertical" size="sm" />
                  </AriaButton>
                  <AriaButton
                    data-action="earlier"
                    aria-label={t(K.earlier, { label: name })}
                    isDisabled={index <= 0}
                    onPress={press("earlier", () => move(index, index - 1))}
                    // Earlier is toward the reading start: the chevrons mirror in right to left.
                    className={cn(CONTROL, "rtl:-scale-x-100") ?? ""}
                  >
                    <Icon name="chevron-left" size="sm" isMirroredInRtl={false} />
                  </AriaButton>
                  <AriaButton
                    data-action="later"
                    aria-label={t(K.later, { label: name })}
                    isDisabled={index >= tiles.length - 1}
                    onPress={press("later", () => move(index, index + 1))}
                    className={cn(CONTROL, "rtl:-scale-x-100") ?? ""}
                  >
                    <Icon name="chevron-right" size="sm" isMirroredInRtl={false} />
                  </AriaButton>
                  <AriaButton
                    data-action="size"
                    aria-label={t(K.size, { label: name, size: sizeName(tile.size) })}
                    onPress={press("size", () => resize(index))}
                    className={CONTROL}
                  >
                    <Icon name="maximize-2" size="sm" />
                  </AriaButton>
                </div>
                {/* The pointer's resize handle on the inline-end edge (the left in Arabic), from md where tiles share
                    a row; the size button is the keyboard's way, so the handle is hidden from assistive technology. */}
                <div
                  aria-hidden
                  data-action="resize"
                  onPointerDown={(event) => startResize(event, tile)}
                  onPointerMove={dragResize}
                  onPointerUp={endResize}
                  onPointerCancel={endResize}
                  className="group/resize absolute inset-y-6 -end-3 z-10 hidden w-4 cursor-ew-resize touch-none items-center justify-center md:flex"
                >
                  <span className="h-12 w-1.5 rounded-[var(--radius-pill)] bg-separator group-hover/resize:bg-accent" />
                </div>
                {renderTile(tile.id)}
              </motion.div>
            </GridListItem>
          );
        }}
      </GridList>
      {live}
    </div>
  );
}
