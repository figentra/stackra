/**
 * Stackra file contract:
 * Purpose: `SchedulerMonth`, the month view of the web Scheduler: a table of weeks from the locale's first weekday,
 *          each day cell with its date (a button that opens the day), its first events and "N more" (which opens the
 *          day too).
 * Boundary: internal. A real table, so weekday headers name each column; the columns follow `dir`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1 and 4.1.2; STA-1371.
 */
import { cn } from "@heroui/react";
import type { CalendarDate } from "@internationalized/date";
import type { ReactElement } from "react";
import { use } from "react";

import { SCHEDULER_KEYS } from "#core/constants/scheduler-keys.constant";
import { eventsOnDayOf } from "#core/functions/events-on-day-of.function";
import { monthGridOf } from "#core/functions/month-grid-of.function";
import { schedulerDaysOf } from "#core/functions/scheduler-days-of.function";
import { DesignSystemContext } from "#react/design-system-provider/design-system-context";
import { useUiText } from "#react/hooks/use-ui-text";
import { SchedulerEventChip } from "#react/scheduler/scheduler-event-chip";
import type { SchedulerViewProps } from "#react/scheduler/scheduler-view-props.type";

/** The Scheduler's keys. */
const K = SCHEDULER_KEYS.ui.scheduler;

/** How many events a day cell shows before "N more". */
const SHOWN = 2;

/** The focus ring of the month's own buttons. */
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-focus";

/** The month grid. */
export function SchedulerMonth({ state, events, onEventPress }: SchedulerViewProps): ReactElement {
  const t = useUiText();
  const locale = use(DesignSystemContext)?.locale ?? "en";
  const open = (day: CalendarDate) => {
    state.setDate(day);
    state.setView("day");
  };
  return (
    <table className="w-full table-fixed border-collapse">
      <thead>
        <tr>
          {schedulerDaysOf("week", state.date, locale).map((day) => (
            <th
              key={day.toString()}
              scope="col"
              className="border-b border-separator py-2 text-xs font-medium text-muted"
            >
              {state.weekdayOf(day)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {monthGridOf(state.date, locale).map((week) => (
          <tr key={week.find(Boolean)?.toString()}>
            {week.map((day, column) => {
              if (!day) {
                return (
                  <td
                    // oxlint-disable-next-line react/no-array-index-key -- the empty cells of a month row never reorder
                    key={column}
                    aria-hidden="true"
                    className="h-24 border border-separator bg-default/40"
                  />
                );
              }
              const list = eventsOnDayOf(events, day, state.timeZone);
              return (
                <td key={day.toString()} className="h-24 border border-separator p-1 align-top">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <button
                      type="button"
                      aria-label={state.fullDateOf(day)}
                      aria-current={state.isToday(day) ? "date" : undefined}
                      onClick={() => open(day)}
                      className={cn(
                        "grid size-6 place-items-center self-start rounded-[var(--radius-pill)] text-xs font-medium tabular-nums",
                        FOCUS,
                        state.isToday(day)
                          ? "bg-danger text-danger-foreground"
                          : "hover:bg-default",
                      )}
                    >
                      {state.dayNumberOf(day)}
                    </button>
                    {list.slice(0, SHOWN).map((event) => (
                      <SchedulerEventChip
                        key={event.id}
                        event={event}
                        state={state}
                        onPress={onEventPress}
                        isCompact
                      />
                    ))}
                    {list.length > SHOWN ? (
                      <button
                        type="button"
                        onClick={() => open(day)}
                        className={cn(
                          "self-start rounded-[var(--radius-control-inner)] px-1 text-xs text-muted hover:text-foreground",
                          FOCUS,
                        )}
                      >
                        {t(K.more, { count: list.length - SHOWN })}
                      </button>
                    ) : null}
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
