/**
 * Stackra file contract:
 * Purpose: `SchedulerAgenda`, the agenda view of the web Scheduler: the month's days that have events, each with its
 *          date and its events in order (time, then the title on its tone's chip); "No events" when the month is empty.
 * Boundary: internal. A list of days, each a list of events.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { SCHEDULER_KEYS } from "#core/constants/scheduler-keys.constant";
import { eventsOnDayOf } from "#core/functions/events-on-day-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { SchedulerEventChip } from "#react/scheduler/scheduler-event-chip";
import type { SchedulerViewProps } from "#react/scheduler/scheduler-view-props.type";

/** The Scheduler's keys. */
const K = SCHEDULER_KEYS.ui.scheduler;

/** The agenda list. */
export function SchedulerAgenda({ state, events, onEventPress }: SchedulerViewProps): ReactElement {
  const t = useUiText();
  const days = state.days
    .map((day) => ({ day, list: eventsOnDayOf(events, day, state.timeZone) }))
    .filter(({ list }) => list.length > 0);
  if (days.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">{t(K.no_events)}</p>;
  }
  return (
    <ol className="flex flex-col divide-y divide-separator">
      {days.map(({ day, list }) => (
        <li key={day.toString()} className="flex gap-4 px-3 py-3">
          <div className="flex w-12 shrink-0 flex-col items-center">
            <span className="text-xs text-muted">{state.weekdayOf(day)}</span>
            <span
              className={cn(
                "grid size-8 place-items-center rounded-[var(--radius-pill)] text-sm font-semibold tabular-nums",
                state.isToday(day) && "bg-danger text-danger-foreground",
              )}
            >
              {state.dayNumberOf(day)}
            </span>
          </div>
          <ul aria-label={state.fullDateOf(day)} className="flex min-w-0 flex-1 flex-col gap-1.5">
            {list.map((event) => (
              <li key={event.id} className="flex items-center gap-3">
                <span className="min-w-36 shrink-0 text-xs whitespace-nowrap text-muted tabular-nums">
                  {state.timeOf(event)}
                </span>
                <div className="min-w-0 flex-1">
                  <SchedulerEventChip
                    event={event}
                    state={state}
                    onPress={onEventPress}
                    isCompact
                  />
                </div>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
