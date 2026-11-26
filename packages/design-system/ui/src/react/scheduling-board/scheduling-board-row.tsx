/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardRow`, one resource row of the web SchedulingBoard: a sticky row header (avatar, label,
 *          indented under its parents) at the inline start, then the lane, drawn back to front: the past and the time
 *          outside working time shaded, working-time bands, closures hatched across the row, one cell per slot (a
 *          button that selects when the board allows it), the blocks in their lanes, the drag preview when the drag is
 *          on this row, and the current-time line.
 * Boundary: internal; every position is a logical inset in `--sb-col` units, so a right-to-left board mirrors. The
 *           grid's input hook reads the pointer and keys through `data-lane`, `data-resource-id` and `data-key`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WAI-ARIA grid pattern; WCAG 2.2 SC 1.3.1,
 *          2.4.7, 2.5.8 and 4.1.2; shared modules step 4a (LEADER, 2026-11-09).
 */
import { cn } from "@heroui/react";
import type { CSSProperties, ReactElement } from "react";

import { SCHEDULING_BOARD_KEYS } from "#core/constants/scheduling-board-keys.constant";
import { Avatar } from "#react/avatar/avatar";
import { useUiText } from "#react/hooks/use-ui-text";
import { SchedulingBoardBlock } from "#react/scheduling-board/scheduling-board-block";
import { SchedulingBoardPreview } from "#react/scheduling-board/scheduling-board-preview";
import type { SchedulingBoardRowProps } from "#react/scheduling-board/scheduling-board-row.props";

/** The SchedulingBoard's keys. */
const K = SCHEDULING_BOARD_KEYS.ui.scheduling_board;

/** The focus ring of the row's own stops. */
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset";

/** A closure's hatch: the danger tint in stripes, from the theme's colour and spacing. */
const HATCH =
  "bg-[repeating-linear-gradient(135deg,var(--color-danger-soft)_0_calc(var(--spacing)*1.5),transparent_0_calc(var(--spacing)*3))]";

/** The inset and width of a stretch of columns. */
const spanOf = (offset: number, length: number): CSSProperties => ({
  insetInlineStart: `calc(var(--sb-col) * ${offset})`,
  width: `calc(var(--sb-col) * ${length})`,
});

/** One resource row. */
export function SchedulingBoardRow({
  lane,
  state,
  input,
  edges,
  selectable,
  renderItem,
}: SchedulingBoardRowProps): ReactElement {
  const t = useUiText();
  const { resource, depth, ancestors, placements, shade } = lane;
  const count = state.columns.length;
  const past = Math.min(count, state.pastLength);
  const drag = input.drag;
  const hasPreview = drag !== null && drag.draft.resourceId === resource.id;
  const liftedId =
    drag?.placed && drag.origin.resourceId === resource.id ? drag.placed.item.id : null;
  return (
    <div
      role="row"
      data-resource-id={resource.id}
      className="flex w-max min-w-full border-b border-separator"
    >
      <div
        role="rowheader"
        className="sticky start-0 z-(--z-sticky) flex w-(--sb-res) shrink-0 items-center gap-2 border-e border-separator bg-surface py-1 pe-3 text-sm"
        style={{ paddingInlineStart: `calc(var(--spacing) * ${3 + depth * 4})` }}
      >
        {resource.avatarUrl ? (
          <Avatar src={resource.avatarUrl} name={resource.label} size="sm" />
        ) : null}
        <span className="truncate">{resource.label}</span>
      </div>
      <div
        data-lane=""
        className={cn("relative shrink-0", hasPreview ? "z-(--z-pinned)" : "isolate")}
        style={{
          width: `calc(var(--sb-col) * ${count})`,
          height: `calc(var(--spacing) * ${Math.max(14, lane.lanes * 9)})`,
        }}
      >
        {past > 0 ? (
          <div
            aria-hidden="true"
            className="absolute inset-y-0 bg-default/40"
            style={spanOf(0, past)}
          />
        ) : null}
        {shade.map((span) => (
          <div
            key={`shade-${span.offset}`}
            aria-hidden="true"
            className="absolute inset-y-0 bg-default/60"
            style={spanOf(span.offset, span.length)}
          />
        ))}
        {placements
          .filter((placed) => placed.layer === "band")
          .map((placed) => (
            <div
              key={placed.item.id}
              aria-hidden="true"
              className="absolute inset-y-0 bg-success-soft/50"
              style={spanOf(placed.offset, placed.length)}
            />
          ))}
        {placements
          .filter((placed) => placed.layer === "cover")
          .map((placed) => (
            <div
              key={placed.item.id}
              role="gridcell"
              aria-label={state.nameOf(placed.item, resource)}
              title={placed.inherited ? state.inheritedLabelOf(placed.item, ancestors) : undefined}
              className={cn(
                "absolute inset-y-0 flex flex-col justify-center overflow-hidden border-y border-dashed border-danger px-1.5 text-xs text-danger-soft-foreground",
                HATCH,
                placed.inherited && "opacity-(--opacity-muted)",
              )}
              style={spanOf(placed.offset, placed.length)}
            >
              <span aria-hidden="true" className="truncate font-medium">
                {t(K.kind_closure)}
              </span>
              <span aria-hidden="true" className="truncate">
                {placed.item.title}
              </span>
            </div>
          ))}
        <div className="relative flex h-full">
          {state.columns.map((column, index) => {
            const key = input.cellKey(resource.id, index);
            const edge = edges[index];
            const className = cn(
              "h-full w-(--sb-col) shrink-0",
              index > 0 && edge === "day" && "border-s border-separator",
              index > 0 && edge === "hour" && "border-s border-separator/60",
            );
            const name = state.slotNameOf(resource, column);
            const tabIndex = input.tabKey === key ? 0 : -1;
            return selectable ? (
              <div key={key} role="gridcell" className={className}>
                <button
                  type="button"
                  data-key={key}
                  tabIndex={tabIndex}
                  aria-label={name}
                  onClick={() => input.pressSlot(resource.id, index)}
                  className={cn("block size-full cursor-cell hover:bg-default/50", FOCUS)}
                />
              </div>
            ) : (
              <div
                key={key}
                role="gridcell"
                data-key={key}
                tabIndex={tabIndex}
                aria-label={name}
                className={cn(className, FOCUS)}
              />
            );
          })}
        </div>
        {placements
          .filter((placed) => placed.layer === "block")
          .map((placed) => (
            <SchedulingBoardBlock
              key={placed.item.id}
              placed={placed}
              resource={resource}
              ancestors={ancestors}
              state={state}
              stopKey={input.blockKey(resource.id, placed.item.id)}
              isTabStop={input.tabKey === input.blockKey(resource.id, placed.item.id)}
              isLifted={liftedId === placed.item.id}
              onPress={input.pressItem}
              renderItem={renderItem}
            />
          ))}
        {drag !== null && hasPreview ? <SchedulingBoardPreview state={state} drag={drag} /> : null}
        {state.nowAt === null ? null : (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-0.5 bg-danger"
            style={{ insetInlineStart: `calc(var(--sb-col) * ${state.nowAt})` }}
          />
        )}
      </div>
    </div>
  );
}
