/**
 * Stackra file contract:
 * Purpose: `SchedulerAgenda`, the agenda view of the native Scheduler: the month's days that have events, each with
 *          its date and its events in order (time, then the title on its tone's chip); "No events" when it is empty.
 * Boundary: internal. Rows follow the platform direction.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 4.1.2; STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { SCHEDULER_KEYS } from "#core/constants/scheduler-keys.constant";
import { eventsOnDayOf } from "#core/functions/events-on-day-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { SchedulerEventChip } from "#native/scheduler/scheduler-event-chip";
import type { SchedulerViewProps } from "#native/scheduler/scheduler-view-props.type";
import { Text } from "#native/text/text";

/** The Scheduler's keys. */
const K = SCHEDULER_KEYS.ui.scheduler;

/** The agenda list. */
export function SchedulerAgenda({ state, events, onEventPress }: SchedulerViewProps): ReactElement {
  const t = useUiText();
  const days = state.days
    .map((day) => ({ day, list: eventsOnDayOf(events, day, state.timeZone) }))
    .filter(({ list }) => list.length > 0);
  if (days.length === 0) {
    return (
      <Text tone="muted" align="center" className="py-10">
        {t(K.no_events)}
      </Text>
    );
  }
  return (
    <View>
      {days.map(({ day, list }) => {
        const isToday = state.isToday(day);
        return (
          <View key={day.toString()} className="flex-row gap-3 border-b border-separator p-3">
            <View
              className="w-12 items-center"
              accessibilityLabel={state.fullDateOf(day)}
              accessible
            >
              <Text type="caption" tone="muted">
                {state.weekdayOf(day)}
              </Text>
              <View
                className={`size-8 items-center justify-center rounded-[var(--radius-pill)] ${
                  isToday ? "bg-danger" : ""
                }`}
              >
                <Text className={`font-semibold ${isToday ? "text-danger-foreground" : ""}`}>
                  {state.dayNumberOf(day)}
                </Text>
              </View>
            </View>
            <View className="flex-1 gap-1.5">
              {list.map((event) => (
                <View key={event.id} className="gap-0.5">
                  <Text type="caption" tone="muted">
                    {state.timeOf(event)}
                  </Text>
                  <SchedulerEventChip
                    event={event}
                    state={state}
                    onPress={onEventPress}
                    isCompact
                  />
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}
