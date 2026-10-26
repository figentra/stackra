/**
 * Stackra file contract:
 * Purpose: the native `ResourceScheduler`: a day or week of bookings in one column per resource (staff, room or chair)
 *          per day, on a time axis; a finger drags a booking to move it in time or to another column, and drags its
 *          bottom edge to resize it, both snapped to the step; processing gaps show inside a booking and leave the
 *          resource free, so another booking may sit in them. The web scheduler's contract, on React Native.
 * Boundary: proposes, never saves: a finished drag or an action calls `onEventChange` with the booking as it would be,
 *           and the caller saves or refuses it. The screen-reader way for every drag is each booking's actions
 *           (`ui_pro::scheduler.*`), with `keyboardHint` read as its hint. Times are the caller's wall-clock minutes;
 *           the hours, the week and the step are its data (settings and the market pack), never defaults here. The
 *           snapping, lanes and processing gaps are the web scheduler's own functions. In a right-to-left layout a drag
 *           to the left moves to the next column. Scrolling a long day is the screen's.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 2.5.7 (a single-pointer way for every drag).
 */
import { Text } from "@stackra/ui/native";
import { useState, type ReactElement, type ReactNode } from "react";
import { I18nManager, View } from "react-native";

import type { ResourceSchedulerContractProps } from "#contracts/types/resource-scheduler-contract-props.type";
import type { SchedulerEvent } from "#contracts/types/scheduler-event.type";
import { UI_PRO_KEYS } from "#core/constants/ui-pro-keys.constant";
import { eventLanes } from "#core/functions/event-lanes.function";
import { moveEvent } from "#core/functions/move-event.function";
import { resizeEvent } from "#core/functions/resize-event.function";
import { useUiProText } from "#core/hooks/use-ui-pro-text";
import { SchedulerBooking } from "#native/resource-scheduler/scheduler-booking";
import type { SchedulerBookingAction } from "#native/resource-scheduler/scheduler-booking.props";

/** Props of the native ResourceScheduler. */
export type ResourceSchedulerProps = ResourceSchedulerContractProps;

/** A node as the header can draw it: a string or number inside `Text`, any other node as it is. */
function textual(node: ReactNode): ReactNode {
  return typeof node === "string" || typeof node === "number" ? (
    <Text type="caption" isTruncated align="center" className="font-medium">
      {node}
    </Text>
  ) : (
    node
  );
}

/** A day or a week of bookings, one column per resource and day. */
export function ResourceScheduler({
  label,
  view,
  days,
  resources,
  startMinute,
  endMinute,
  slotMinutes,
  slotHeight = 24,
  events,
  onEventChange,
  formatMinute,
  formatDay,
  keyboardHint,
}: ResourceSchedulerProps): ReactElement {
  const t = useUiProText();
  const [preview, setPreview] = useState<SchedulerEvent | null>(null);
  const [columnWidth, setColumnWidth] = useState(0);
  const bounds = { startMinute, endMinute, slotMinutes };
  const perMinute = slotHeight / slotMinutes;
  const bodyHeight = (endMinute - startMinute) * perMinute;
  const sign = I18nManager.isRTL ? -1 : 1;
  const columns = days.flatMap((day) => resources.map((resource) => ({ day, resource })));
  const columnOf = (event: SchedulerEvent): number =>
    columns.findIndex(
      (column) => column.day === event.day && column.resource.id === event.resource,
    );
  const movable = (event: SchedulerEvent): boolean =>
    onEventChange !== undefined && event.isMovable !== false;
  const keys = UI_PRO_KEYS.ui_pro.scheduler;
  const actionLabels: Readonly<Record<SchedulerBookingAction, string>> = {
    move_earlier: t(keys.move_earlier),
    move_later: t(keys.move_later),
    move_previous: t(keys.move_previous),
    move_next: t(keys.move_next),
    lengthen: t(keys.lengthen),
    shorten: t(keys.shorten),
  };

  const propose = (before: SchedulerEvent, after: SchedulerEvent): void => {
    if (
      after.start !== before.start ||
      after.end !== before.end ||
      after.day !== before.day ||
      after.resource !== before.resource
    )
      onEventChange?.(after);
  };

  /** The booking a drag of `dx` and `dy` points would make. */
  const dragged = (
    event: SchedulerEvent,
    mode: "move" | "resize",
    dx: number,
    dy: number,
  ): SchedulerEvent => {
    const minutes = dy / perMinute;
    if (mode === "resize") return resizeEvent(event, minutes, bounds);
    const shift = columnWidth > 0 ? Math.round((dx / columnWidth) * sign) : 0;
    const target = columns[Math.min(Math.max(columnOf(event) + shift, 0), columns.length - 1)];
    return moveEvent(
      event,
      minutes,
      bounds,
      target && { day: target.day, resource: target.resource.id },
    );
  };

  /** The booking a screen-reader action would make, or undefined at an edge. */
  const acted = (
    event: SchedulerEvent,
    action: SchedulerBookingAction,
  ): SchedulerEvent | undefined => {
    switch (action) {
      case "move_earlier":
        return moveEvent(event, -slotMinutes, bounds);
      case "move_later":
        return moveEvent(event, slotMinutes, bounds);
      case "lengthen":
        return resizeEvent(event, slotMinutes, bounds);
      case "shorten":
        return resizeEvent(event, -slotMinutes, bounds);
      case "move_previous":
      case "move_next": {
        const target = columns[columnOf(event) + (action === "move_next" ? 1 : -1)];
        return target === undefined
          ? undefined
          : moveEvent(event, 0, bounds, { day: target.day, resource: target.resource.id });
      }
    }
  };

  const hours: number[] = [];
  for (let minute = startMinute; minute < endMinute; minute += slotMinutes)
    if (minute % 60 === 0 || minute === startMinute) hours.push(minute);

  return (
    <View testID="resource-scheduler" accessibilityLabel={label} className="gap-1">
      <View className="flex-row">
        <View className="w-12" />
        {columns.map(({ day, resource }) => (
          <View key={`${day}:${resource.id}`} className="min-w-0 flex-1 px-1">
            {view === "week" ? (
              <Text type="caption" tone="muted" isTruncated align="center">
                {formatDay(day)}
              </Text>
            ) : null}
            {textual(resource.label)}
          </View>
        ))}
      </View>
      <View className="flex-row">
        <View
          className="w-12"
          style={{ height: bodyHeight }}
          importantForAccessibility="no-hide-descendants"
        >
          {hours.map((minute) => (
            <View
              key={minute}
              style={{ position: "absolute", top: (minute - startMinute) * perMinute, end: 4 }}
            >
              <Text type="caption" tone="muted">
                {formatMinute(minute)}
              </Text>
            </View>
          ))}
        </View>
        {columns.map(({ day, resource }, index) => {
          const shown = events.map((event) => (preview?.id === event.id ? preview : event));
          const mine = shown.filter((event) => event.day === day && event.resource === resource.id);
          const lanes = eventLanes(mine);
          return (
            <View
              key={`${day}:${resource.id}`}
              testID={`column-${day}:${resource.id}`}
              accessibilityLabel={`${resource.labelText}, ${formatDay(day)}`}
              onLayout={
                index === 0
                  ? (layout) => setColumnWidth(layout.nativeEvent.layout.width)
                  : undefined
              }
              className="relative min-w-0 flex-1 border-s border-separator"
              style={{ height: bodyHeight }}
            >
              {mine.map((event) => {
                const original = events.find((each) => each.id === event.id) ?? event;
                return (
                  <SchedulerBooking
                    key={event.id}
                    event={event}
                    top={(event.start - startMinute) * perMinute}
                    height={(event.end - event.start) * perMinute}
                    lane={lanes.get(event.id) ?? { lane: 0, lanes: 1 }}
                    perMinute={perMinute}
                    isMovable={movable(original)}
                    label={`${event.title}, ${resource.labelText}, ${formatDay(event.day)} ${formatMinute(event.start)} – ${formatMinute(event.end)}`}
                    hint={keyboardHint}
                    actionLabels={actionLabels}
                    onDrag={(mode, dx, dy) => setPreview(dragged(original, mode, dx, dy))}
                    onDrop={(mode, dx, dy) => {
                      setPreview(null);
                      propose(original, dragged(original, mode, dx, dy));
                    }}
                    onCancel={() => setPreview(null)}
                    onAction={(action) => {
                      const next = acted(original, action);
                      if (next !== undefined) propose(original, next);
                    }}
                  />
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
}
