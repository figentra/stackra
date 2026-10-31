/**
 * Stackra file contract:
 * Purpose: `SchedulerEventChip`, one event of the native Scheduler: a soft block in the event's tone, its title and
 *          time (title only when compact), read as "title, time"; a button when it can be pressed.
 * Boundary: internal; placement is the caller's (`style`). Colours are the tone's token classes.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 4.1.2; STA-1371.
 */
import type { ReactElement } from "react";
import { Pressable, Text as NativeText, View } from "react-native";

import { MARKER_TONE_CLASS_NAME } from "#core/constants/marker-tone-class-name.constant";
import type { SchedulerEventChipProps } from "#native/scheduler/scheduler-event-chip.props";

/** One event. */
export function SchedulerEventChip({
  event,
  state,
  onPress,
  isCompact = false,
  style,
}: SchedulerEventChipProps): ReactElement {
  const tone = MARKER_TONE_CLASS_NAME[event.tone ?? "accent"];
  // The fill goes on the chip, the text colour on its lines.
  const ink = tone
    .split(" ")
    .filter((name) => name.startsWith("text-"))
    .join(" ");
  const className = `overflow-hidden rounded-[var(--radius-control-inner)] px-1 ${
    isCompact ? "py-0.5" : "flex-1 py-1"
  } ${tone}`;
  const body = (
    <>
      <NativeText numberOfLines={1} className={`text-xs font-medium ${ink}`}>
        {event.title}
      </NativeText>
      {isCompact ? null : (
        <NativeText numberOfLines={1} className={`text-xs opacity-80 ${ink}`}>
          {state.timeOf(event)}
        </NativeText>
      )}
    </>
  );
  const chip = onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={state.nameOf(event)}
      onPress={() => onPress(event)}
      className={className}
    >
      {body}
    </Pressable>
  ) : (
    <View accessible accessibilityLabel={state.nameOf(event)} className={className}>
      {body}
    </View>
  );
  return style ? (
    <View className="absolute p-px" style={style}>
      {chip}
    </View>
  ) : (
    chip
  );
}
