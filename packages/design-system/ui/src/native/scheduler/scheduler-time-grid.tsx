/**
 * Stackra file contract:
 * Purpose: `SchedulerTimeGrid`, the day and week views of the native Scheduler: a date header (each date a button that
 *          opens its day), an all-day row when any event is all day, then the hours in a scroll view: an hour column
 *          and one column per day holding its timed events placed by `dayLayoutOf` (overlapping events side by side),
 *          each empty hour a button when `onSlotPress` is set, and a line at the current time on today.
 * Boundary: internal. Rows follow the platform direction, so columns run from the reading start; events sit by `start`
 *           inset, so Arabic mirrors.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.5.8 and 4.1.2; STA-1371.
 */
import type { ReactElement } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { SCHEDULER_KEYS } from "#core/constants/scheduler-keys.constant";
import { dayLayoutOf } from "#core/functions/day-layout-of.function";
import { eventsOnDayOf } from "#core/functions/events-on-day-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { SchedulerEventChip } from "#native/scheduler/scheduler-event-chip";
import type { SchedulerViewProps } from "#native/scheduler/scheduler-view-props.type";
import { Text } from "#native/text/text";

/** The Scheduler's keys. */
const K = SCHEDULER_KEYS.ui.scheduler;

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
    <View>
      <View className="flex-row border-b border-separator">
        <View className="w-10" />
        {days.map((day) => {
          const isToday = state.isToday(day);
          return (
            <View key={day.toString()} className="flex-1 items-center gap-0.5 py-2">
              <Text type="caption" tone="muted">
                {state.weekdayOf(day)}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={state.fullDateOf(day)}
                accessibilityState={{ selected: isToday }}
                onPress={() => {
                  state.setDate(day);
                  state.setView("day");
                }}
                className={`size-8 items-center justify-center rounded-[var(--radius-pill)] ${
                  isToday ? "bg-danger" : ""
                }`}
              >
                <Text
                  type="small"
                  className={`font-medium ${isToday ? "text-danger-foreground" : ""}`}
                >
                  {state.dayNumberOf(day)}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
      {allDay.some((list) => list.length > 0) ? (
        <View className="flex-row border-b border-separator">
          <View className="w-10 py-1 pe-1">
            <Text type="caption" tone="muted" align="end">
              {t(K.all_day)}
            </Text>
          </View>
          {allDay.map((list, column) => (
            <View
              key={days[column]?.toString()}
              className="flex-1 gap-0.5 border-s border-separator p-0.5"
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
            </View>
          ))}
        </View>
      ) : null}
      <ScrollView className="max-h-128">
        <View className="flex-row pt-2">
          <View className="w-10" importantForAccessibility="no-hide-descendants">
            {hours.map((hour) => (
              <View key={hour} className="h-12 pe-1">
                <Text type="caption" tone="muted" align="end" className="-mt-2">
                  {hour === startHour ? "" : state.hourLabelOf(hour)}
                </Text>
              </View>
            ))}
          </View>
          {days.map((day) => (
            <View
              key={day.toString()}
              accessibilityLabel={state.fullDateOf(day)}
              className="relative flex-1 border-s border-separator"
            >
              {hours.map((hour) =>
                onSlotPress ? (
                  <Pressable
                    key={hour}
                    accessibilityRole="button"
                    accessibilityLabel={state.slotNameOf(day, hour)}
                    onPress={() => onSlotPress(state.startOf(day, hour))}
                    className="h-12 border-t border-separator"
                  />
                ) : (
                  <View key={hour} className="h-12 border-t border-separator" />
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
                    start: `${(placed.lane / placed.lanes) * 100}%`,
                    width: `${100 / placed.lanes}%`,
                  }}
                />
              ))}
              {state.isToday(day) && nowShare >= 0 && nowShare <= 1 ? (
                <View
                  accessibilityLabel={t(K.now)}
                  pointerEvents="none"
                  className="absolute inset-x-0 h-0.5 bg-danger"
                  style={{ top: `${nowShare * 100}%` }}
                />
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
