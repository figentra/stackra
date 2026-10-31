/**
 * Stackra file contract:
 * Purpose: `SchedulerMonth`, the month view of the native Scheduler: weekday names, then weeks from the locale's first
 *          weekday, each day cell with its date (a button that opens the day), its first events and "N more" (which
 *          opens the day too).
 * Boundary: internal. Rows follow the platform direction, so Arabic starts at the right.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.5.8 and 4.1.2; STA-1371.
 */
import type { CalendarDate } from "@internationalized/date";
import type { ReactElement } from "react";
import { Pressable, View } from "react-native";

import { SCHEDULER_KEYS } from "#core/constants/scheduler-keys.constant";
import { eventsOnDayOf } from "#core/functions/events-on-day-of.function";
import { monthGridOf } from "#core/functions/month-grid-of.function";
import { schedulerDaysOf } from "#core/functions/scheduler-days-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { SchedulerEventChip } from "#native/scheduler/scheduler-event-chip";
import type { SchedulerViewProps } from "#native/scheduler/scheduler-view-props.type";
import { Text } from "#native/text/text";

/** The Scheduler's keys. */
const K = SCHEDULER_KEYS.ui.scheduler;

/** How many events a day cell shows before "N more". */
const SHOWN = 2;

/** The month grid. */
export function SchedulerMonth({
  state,
  events,
  onEventPress,
  locale,
}: SchedulerViewProps): ReactElement {
  const t = useUiText();
  const open = (day: CalendarDate) => {
    state.setDate(day);
    state.setView("day");
  };
  return (
    <View>
      <View
        className="flex-row border-b border-separator"
        importantForAccessibility="no-hide-descendants"
      >
        {schedulerDaysOf("week", state.date, locale).map((day) => (
          <Text
            key={day.toString()}
            type="caption"
            tone="muted"
            align="center"
            className="flex-1 py-2"
          >
            {state.weekdayOf(day)}
          </Text>
        ))}
      </View>
      {monthGridOf(state.date, locale).map((week) => (
        <View key={week.find(Boolean)?.toString()} className="flex-row">
          {week.map((day, column) => {
            if (!day) {
              return (
                <View
                  // oxlint-disable-next-line react/no-array-index-key -- the empty cells of a month row never reorder
                  key={column}
                  className="min-h-20 flex-1 border-b border-s border-separator bg-default/40"
                />
              );
            }
            const list = eventsOnDayOf(events, day, state.timeZone);
            const isToday = state.isToday(day);
            return (
              <View
                key={day.toString()}
                className="min-h-20 flex-1 gap-0.5 border-b border-s border-separator p-0.5"
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={state.fullDateOf(day)}
                  accessibilityState={{ selected: isToday }}
                  onPress={() => open(day)}
                  className={`size-6 items-center justify-center rounded-[var(--radius-pill)] ${
                    isToday ? "bg-danger" : ""
                  }`}
                >
                  <Text
                    type="caption"
                    className={`font-medium ${isToday ? "text-danger-foreground" : ""}`}
                  >
                    {state.dayNumberOf(day)}
                  </Text>
                </Pressable>
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
                  <Pressable accessibilityRole="button" onPress={() => open(day)}>
                    <Text type="caption" tone="muted">
                      {t(K.more, { count: list.length - SHOWN })}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
