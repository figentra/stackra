/**
 * Stackra file contract:
 * Purpose: `SchedulerTimeGrid`, the day and week views of the web Scheduler: a date header (each date a button that
 *          opens its day), an all-day row when any event is all day, then the hours: an hour column and one column per
 *          day holding its timed events placed by `dayLayoutOf` (overlapping events side by side), each empty hour a
 *          button when `onSlotPress` is set, and a line at the current time on today.
 * Boundary: internal. Columns run from the reading start (flex follows `dir`); events sit by logical inset, so Arabic
 *           mirrors. Each day column is a group named by its full date. The hours scroll inside the view.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.4.7 and 4.1.2; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { SCHEDULER_KEYS } from "#core/constants/scheduler-keys.constant";
import { dayLayoutOf } from "#core/functions/day-layout-of.function";
import { eventsOnDayOf } from "#core/functions/events-on-day-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { SchedulerEventChip } from "#react/scheduler/scheduler-event-chip";
import type { SchedulerViewProps } from "#react/scheduler/scheduler-view-props.type";

/** The Scheduler's keys. */
const K = SCHEDULER_KEYS.ui.scheduler;

/** The focus ring of the grid's own buttons. */
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset";

/** The day or week time grid. */
export function SchedulerTimeGrid({
  state,
  events,
  onEventPress,
  onSlotPress,
}: SchedulerViewProps): ReactElement {
  const t = useUiText();
  const { days, startHour, endHour, timeZone } = state;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const allDay = days.map((day) =>
    eventsOnDayOf(events, day, timeZone).filter((event) => event.isAllDay),
  );
  const nowShare =
    (state.now.getTime() - state.startOf(state.today, startHour).getTime()) /
    ((endHour - startHour) * 3_600_000);
  return (
    <div className="flex flex-col">
      <div className="flex border-b border-separator">
        <div className="w-14 shrink-0" />
        {days.map((day) => (
          <div
            key={day.toString()}
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2"
          >
            <span className="text-xs text-muted">{state.weekdayOf(day)}</span>
            <button
              type="button"
              aria-label={state.fullDateOf(day)}
              aria-current={state.isToday(day) ? "date" : undefined}
              onClick={() => {
                state.setDate(day);
                state.setView("day");
              }}
              className={cn(
                "grid size-8 place-items-center rounded-[var(--radius-pill)] text-sm font-medium tabular-nums",
                FOCUS,
                state.isToday(day) ? "bg-danger text-danger-foreground" : "hover:bg-default",
              )}
            >
              {state.dayNumberOf(day)}
            </button>
          </div>
        ))}
      </div>
      {allDay.some((list) => list.length > 0) ? (
        <div className="flex border-b border-separator">
          <div className="w-14 shrink-0 py-1 pe-2 text-end text-xs text-muted">{t(K.all_day)}</div>
          {allDay.map((list, column) => (
            <div
              key={days[column]?.toString()}
              className="flex min-w-0 flex-1 flex-col gap-0.5 border-s border-separator p-0.5"
            >
              {list.map((event) => (
                <SchedulerEventChip
                  key={event.id}
                  event={event}
                  state={state}
                  onPress={onEventPress}
                  isCompact
                />
              ))}
            </div>
          ))}
        </div>
      ) : null}
      <div className="max-h-128 overflow-y-auto">
        <div className="flex pt-2">
          <div className="w-14 shrink-0" aria-hidden="true">
            {hours.map((hour) => (
              <div key={hour} className="h-12 pe-2 text-end text-xs text-muted tabular-nums">
                <span className="relative -top-2">
                  {hour === startHour ? "" : state.hourLabelOf(hour)}
                </span>
              </div>
            ))}
          </div>
          {days.map((day) => (
            <div
              key={day.toString()}
              role="group"
              aria-label={state.fullDateOf(day)}
              className="relative min-w-0 flex-1 border-s border-separator"
            >
              {hours.map((hour) =>
                onSlotPress ? (
                  <button
                    key={hour}
                    type="button"
                    aria-label={state.slotNameOf(day, hour)}
                    onClick={() => onSlotPress(state.startOf(day, hour))}
                    className={cn(
                      "block h-12 w-full border-t border-separator hover:bg-default",
                      FOCUS,
                    )}
                  />
                ) : (
                  <div key={hour} className="h-12 border-t border-separator" />
                ),
              )}
              {dayLayoutOf(events, day, { timeZone, startHour, endHour }).map((placed) => (
                <SchedulerEventChip
                  key={placed.event.id}
                  event={placed.event}
                  state={state}
                  onPress={onEventPress}
                  style={{
                    top: `${placed.top * 100}%`,
                    height: `${placed.height * 100}%`,
                    insetInlineStart: `${(placed.lane / placed.lanes) * 100}%`,
                    width: `${100 / placed.lanes}%`,
                  }}
                />
              ))}
              {state.isToday(day) && nowShare >= 0 && nowShare <= 1 ? (
                <div
                  role="img"
                  aria-label={t(K.now)}
                  className="pointer-events-none absolute inset-x-0 h-0.5 bg-danger"
                  style={{ top: `${nowShare * 100}%` }}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
