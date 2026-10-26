/**
 * Stackra file contract:
 * Purpose: `SchedulerBooking`, one booking block of the native `ResourceScheduler`: a pressable block that a finger
 *          drags to move it and whose bottom edge it drags to resize it, with its processing gaps drawn lighter, its
 *          title, and screen-reader actions (earlier, later, previous and next column, longer, shorter) that do the
 *          same as a drag.
 * Boundary: internal; reports distances and actions, never bookings: the scheduler snaps and proposes. Each gesture is
 *           a PanResponder held for the block's lifetime, so a re-render mid-drag keeps the gesture.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 2.5.7 and 4.1.2.
 */
import { Text } from "@stackra/ui/native";
import { useMemo, useRef, type ReactElement } from "react";
import { PanResponder, View, type PanResponderInstance } from "react-native";

import type { SchedulerBookingAction } from "#native/resource-scheduler/scheduler-booking-action.type";
import type { SchedulerBookingProps } from "#native/resource-scheduler/scheduler-booking.props";

/** The order the actions are offered in. */
const ACTIONS: readonly SchedulerBookingAction[] = Object.freeze([
  "move_earlier",
  "move_later",
  "move_previous",
  "move_next",
  "lengthen",
  "shorten",
]);

/** One booking on the scheduler. */
export function SchedulerBooking(props: SchedulerBookingProps): ReactElement {
  const { event, top, height, lane, perMinute, isMovable, label, hint, actionLabels } = props;
  // The gestures read the latest callbacks through this ref: each PanResponder is created once.
  const latest = useRef(props);
  // oxlint-disable-next-line react/refs -- reason: the ref holds the latest props for gesture handlers created once; it is never read to render
  latest.current = props;

  const [move, resize] = useMemo(() => {
    const gesture = (mode: "move" | "resize"): PanResponderInstance =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => latest.current.isMovable,
        onMoveShouldSetPanResponder: () => latest.current.isMovable,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, state) => latest.current.onDrag(mode, state.dx, state.dy),
        onPanResponderRelease: (_, state) => latest.current.onDrop(mode, state.dx, state.dy),
        onPanResponderTerminate: () => latest.current.onCancel(),
      });
    // oxlint-disable-next-line react/refs -- reason: the gestures read the ref in their handlers, never during render
    return [gesture("move"), gesture("resize")];
  }, []);

  return (
    <View
      style={{
        position: "absolute",
        top,
        height,
        insetInlineStart: `${(lane.lane / lane.lanes) * 100}%`,
        width: `${100 / lane.lanes}%`,
        padding: 1,
      }}
    >
      <View
        {...move.panHandlers}
        testID={`booking-${event.id}`}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityState={{ disabled: !isMovable }}
        accessibilityActions={
          isMovable
            ? [
                { name: "increment", label: actionLabels.move_later },
                { name: "decrement", label: actionLabels.move_earlier },
                ...ACTIONS.map((name) => ({ name, label: actionLabels[name] })),
              ]
            : []
        }
        onAccessibilityAction={({ nativeEvent }) => {
          const name = nativeEvent.actionName as SchedulerBookingAction;
          if (ACTIONS.includes(name)) latest.current.onAction(name);
          // The adjustable role's swipe up and down move the booking by a step.
          else if (nativeEvent.actionName === "increment") latest.current.onAction("move_later");
          else if (nativeEvent.actionName === "decrement") latest.current.onAction("move_earlier");
        }}
        className="h-full w-full overflow-hidden rounded-md bg-accent-soft"
      >
        {(event.segments ?? [])
          .filter((segment) => segment.kind === "processing")
          .map((segment) => (
            <View
              key={segment.offset}
              testID="booking-processing"
              className="absolute inset-x-0 bg-background/60"
              style={{ top: segment.offset * perMinute, height: segment.duration * perMinute }}
            />
          ))}
        <Text type="caption" isTruncated className="px-1 text-accent-soft-foreground">
          {event.title}
        </Text>
        {isMovable ? (
          <View
            {...resize.panHandlers}
            testID="booking-resize-handle"
            importantForAccessibility="no"
            className="absolute inset-x-0 bottom-0 h-3"
          />
        ) : null}
      </View>
    </View>
  );
}
