/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardTimeHeader`, the column headers of the web SchedulingBoard, sticky at the top: in the day
 *          and week views a row of days (weekday and date, and the day's mark: a holiday's name or its status, shaded
 *          for a rest day or holiday, amber when uncertain) over a row of slots labelled on each hour; in the timeline
 *          one row with a header per day. The corner names the resource column; a marker shows now.
 * Boundary: internal; the corner is sticky at the inline start and every width is in `--sb-col` units, so a
 *           right-to-left board mirrors.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WAI-ARIA grid pattern; WCAG 2.2 SC 1.3.1 and
 *          1.4.1; shared modules step 4a (LEADER, 2026-11-09).
 */
import type { CalendarDate } from "@internationalized/date";
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { SCHEDULING_BOARD_KEYS } from "#core/constants/scheduling-board-keys.constant";
import type { SchedulingBoardState } from "#core/types/scheduling-board-state.type";
import { useUiText } from "#react/hooks/use-ui-text";
import type { SchedulingBoardTimeHeaderProps } from "#react/scheduling-board/scheduling-board-time-header.props";

/** The SchedulingBoard's keys. */
const K = SCHEDULING_BOARD_KEYS.ui.scheduling_board;

/** The sticky corner cell over the resource column. */
const CORNER =
  "sticky start-0 z-(--z-raised) flex w-(--sb-res) shrink-0 items-end border-e border-separator bg-surface px-3 py-1 text-xs font-medium text-muted";

/** A day's header words and shading, from its mark. */
function DayHeader({
  state,
  day,
  length,
  label,
  hasEdge,
}: {
  readonly state: SchedulingBoardState;
  readonly day: CalendarDate;
  readonly length: number;
  readonly label: string;
  readonly hasEdge: boolean;
}): ReactElement {
  const mark = state.dayMarkOf(day);
  const words = mark ? (mark.label ?? state.dayStatusLabelOf(mark)) : "";
  return (
    <div
      role="columnheader"
      aria-colspan={length}
      className={cn(
        "flex shrink-0 flex-col justify-center overflow-hidden px-2 py-1 text-xs",
        hasEdge && "border-s border-separator",
        (mark?.status === "rest_day" || mark?.status === "holiday") && "bg-default",
        mark?.status === "uncertain" && "bg-warning-soft text-warning-soft-foreground",
      )}
      style={{ width: `calc(var(--sb-col) * ${length})` }}
    >
      <span className="truncate font-medium">{label}</span>
      {words ? <span className="truncate text-muted">{words}</span> : null}
    </div>
  );
}

/** The column headers. */
export function SchedulingBoardTimeHeader({
  state,
  edges,
}: SchedulingBoardTimeHeaderProps): ReactElement {
  const t = useUiText();
  const { columns } = state;
  const now =
    state.nowAt === null ? null : (
      <div
        role="img"
        aria-label={t(K.now)}
        className="pointer-events-none absolute bottom-0 size-2 -translate-x-1/2 rounded-[var(--radius-pill)] bg-danger rtl:translate-x-1/2"
        style={{ insetInlineStart: `calc(var(--sb-col) * ${state.nowAt})` }}
      />
    );
  if (state.view === "timeline") {
    return (
      <div role="row" className="flex w-max min-w-full border-b border-separator">
        <div role="columnheader" className={CORNER}>
          {t(K.resources)}
        </div>
        <div className="relative flex">
          {columns.map((column, index) => (
            <DayHeader
              key={column.day.toString()}
              state={state}
              day={column.day}
              length={1}
              label={state.columnLabelOf(column)}
              hasEdge={index > 0}
            />
          ))}
          {now}
        </div>
      </div>
    );
  }
  const days: { day: CalendarDate; length: number; from: number }[] = [];
  for (const [index, column] of columns.entries()) {
    const last = days.at(-1);
    if (last && last.day.compare(column.day) === 0) last.length += 1;
    else days.push({ day: column.day, length: 1, from: index });
  }
  return (
    <>
      <div role="row" className="flex w-max min-w-full">
        <div role="columnheader" className={CORNER}>
          {t(K.resources)}
        </div>
        {days.map(({ day, length, from }) => (
          <DayHeader
            key={day.toString()}
            state={state}
            day={day}
            length={length}
            label={state.dayLabelOf(day)}
            hasEdge={from > 0}
          />
        ))}
      </div>
      <div role="row" className="flex w-max min-w-full border-b border-separator">
        {/* The corner under the resource column's header names nothing, so it is drawing only. */}
        <div aria-hidden="true" className={CORNER} />
        <div className="relative flex">
          {columns.map((column, index) => (
            <div
              key={column.start.getTime()}
              role="columnheader"
              className={cn(
                "relative h-6 w-(--sb-col) shrink-0",
                index > 0 && edges[index] === "day" && "border-s border-separator",
                index > 0 && edges[index] === "hour" && "border-s border-separator/60",
              )}
            >
              {edges[index] === "none" ? null : (
                <span className="absolute start-1 top-1 text-xs whitespace-nowrap text-muted tabular-nums">
                  {state.columnLabelOf(column)}
                </span>
              )}
            </div>
          ))}
          {now}
        </div>
      </div>
    </>
  );
}
