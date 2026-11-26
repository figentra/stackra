/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardGrid`, the body of the web SchedulingBoard: a `grid` that scrolls both ways, its column
 *          headers sticky at the top and its resource column sticky at the inline start, then the rows in order: a
 *          group's heading (a button that hides or shows its resources) or a resource row. Columns are a fixed width
 *          (`--sb-col`: wider for longer slots, widest for the timeline's days), so every position is `offset` columns.
 * Boundary: internal; the layout comes from the shared state (rows, placements, shading) and the input from
 *           `useSchedulingBoardInput` (one Tab stop, arrows inside). Sizes are the theme's spacing; directions are
 *           logical, so a right-to-left board mirrors.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WAI-ARIA grid pattern; WCAG 2.2 SC 1.3.1,
 *          2.1.1, 2.4.3 and 4.1.2; shared modules step 4a (LEADER, 2026-11-09).
 */
import { fromDate } from "@internationalized/date";
import { cn } from "@heroui/react";
import type { CSSProperties, ReactElement } from "react";

import { SCHEDULING_BOARD_KEYS } from "#core/constants/scheduling-board-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import type { SchedulingBoardGridProps } from "#react/scheduling-board/scheduling-board-grid.props";
import type { SchedulingBoardLane } from "#react/scheduling-board/scheduling-board-lane.type";
import { SchedulingBoardRow } from "#react/scheduling-board/scheduling-board-row";
import { SchedulingBoardTimeHeader } from "#react/scheduling-board/scheduling-board-time-header";
import { useSchedulingBoardInput } from "#react/scheduling-board/use-scheduling-board-input";

/** The SchedulingBoard's keys. */
const K = SCHEDULING_BOARD_KEYS.ui.scheduling_board;

/** An hour in milliseconds. */
const HOUR = 3_600_000;

/** The focus ring of a group heading's button. */
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-focus";

/** The grid of rows and columns. */
export function SchedulingBoardGrid({
  state,
  label,
  timeZone,
  locale,
  selectable,
  onItemPress,
  renderItem,
}: SchedulingBoardGridProps): ReactElement {
  const t = useUiText();
  const { columns } = state;
  const built = state.rows.map((row) => {
    if (row.kind === "group") return row;
    const placements = state.placementsOf(row.resource.id, row.ancestors);
    const lane: SchedulingBoardLane = {
      resource: row.resource,
      depth: row.depth,
      ancestors: row.ancestors,
      placements,
      shade: state.shadeOf(row.resource.id),
      lanes: Math.max(
        1,
        ...placements.filter((placed) => placed.layer === "block").map((placed) => placed.lanes),
      ),
    };
    return lane;
  });
  const lanes = built.filter((row): row is SchedulingBoardLane => "resource" in row);
  // the callback ref is taken out, so the rest of the input is plain values and handlers, never read as a ref
  const { attach, ...input } = useSchedulingBoardInput(
    state,
    lanes,
    selectable,
    onItemPress,
    locale,
  );
  const edges = columns.map((column, index) =>
    column.opensDay && index > 0
      ? ("day" as const)
      : column.opensDay || fromDate(column.start, timeZone).minute === 0
        ? ("hour" as const)
        : ("none" as const),
  );
  const first = columns[0];
  const columnMs = first ? first.end.getTime() - first.start.getTime() : HOUR;
  // A slot is at least 8 spacing units wide (a 24 px target); an hour of slots at least 24; a timeline day 28.
  const units =
    state.view === "timeline" ? 28 : Math.max(8, Math.ceil(24 / Math.max(1, HOUR / columnMs)));
  const style = {
    "--sb-col": `calc(var(--spacing) * ${units})`,
    "--sb-res": "calc(var(--spacing) * 48)",
  } as CSSProperties;

  return (
    <div
      ref={attach}
      role="grid"
      tabIndex={-1}
      aria-label={label}
      aria-readonly={state.readOnly || undefined}
      className={cn("relative max-h-160 overflow-auto", input.drag && "select-none")}
      style={style}
      onKeyDown={input.onKeyDown}
      onPointerDown={input.onPointerDown}
      onFocus={input.onFocus}
      onBlur={input.onBlur}
    >
      <div role="rowgroup" className="sticky top-0 z-(--z-dock) w-max min-w-full bg-surface">
        <SchedulingBoardTimeHeader state={state} edges={edges} />
      </div>
      <div role="rowgroup" className="w-max min-w-full">
        {built.map((row) =>
          "resource" in row ? (
            <SchedulingBoardRow
              key={row.resource.id}
              lane={row}
              state={state}
              input={input}
              edges={edges}
              selectable={selectable}
              renderItem={renderItem}
            />
          ) : (
            <div
              key={`group-${row.group}`}
              role="row"
              className="flex w-max min-w-full border-b border-separator bg-surface-secondary"
            >
              <div
                role="gridcell"
                aria-colspan={columns.length + 1}
                className="sticky start-0 px-2 py-1"
              >
                <button
                  type="button"
                  aria-expanded={!row.collapsed}
                  aria-label={t(row.collapsed ? K.show_group : K.hide_group, { group: row.group })}
                  onClick={() => state.toggleGroup(row.group)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-[var(--radius-control-inner)] px-1 py-0.5 text-sm font-medium hover:bg-default",
                    FOCUS,
                  )}
                >
                  <Icon
                    name="chevron-down"
                    size="sm"
                    className={cn(
                      "transition-transform motion-reduce:transition-none",
                      row.collapsed && "-rotate-90 rtl:rotate-90",
                    )}
                  />
                  {row.group}
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
