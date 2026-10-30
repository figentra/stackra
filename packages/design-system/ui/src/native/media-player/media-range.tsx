/**
 * Stackra file contract:
 * Purpose: the native MediaPlayer's `MediaRange`: a thin track with what is loaded, the played fill and a thumb. A
 *          press or drag moves it; VoiceOver and TalkBack read it as one adjustable control with its value text, and
 *          a swipe up or down moves one step.
 * Boundary: internal. Always left to right (the player's controls row is): physical left, so a drag to the right moves
 *           forward in every language, as on YouTube and the system players. Nothing animates.
 * Runtime: react-native
 * Governing contract: WCAG 2.2 SC 2.5.1 and 4.1.2; STA-1371 (owner approval 2026-10-30).
 */
import { useState, type ReactElement } from "react";
import { View, type AccessibilityActionEvent, type GestureResponderEvent } from "react-native";

import { mediaShareOf } from "#core/functions/media-share-of.function";
import type { MediaRangeProps } from "#native/media-player/media-range.props";

/** The thumb's size, so its centre sits on the position. */
const THUMB = 14;

/** The timeline or the volume of a native MediaPlayer. */
export function MediaRange({
  value,
  max,
  buffered,
  label,
  valueText,
  step,
  onChange,
  className,
}: MediaRangeProps): ReactElement {
  const [width, setWidth] = useState(0);
  const clamp = (next: number) => Math.min(max, Math.max(0, next));
  // The track's children take no touches, so the location is always measured from the track's own left edge.
  const pointTo = (event: GestureResponderEvent) =>
    onChange(clamp((event.nativeEvent.locationX / (width || 1)) * max));
  const share = mediaShareOf(value, max);
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: valueText }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event: AccessibilityActionEvent) =>
        onChange(clamp(value + (event.nativeEvent.actionName === "increment" ? step : -step)))
      }
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={pointTo}
      onResponderMove={pointTo}
      style={{ direction: "ltr" }}
      className={`h-8 justify-center ${className ?? ""}`}
    >
      <View
        pointerEvents="none"
        className="h-1 w-full overflow-hidden rounded-[var(--radius-pill)] bg-default"
      >
        {buffered === undefined ? null : (
          <View
            className="absolute inset-y-0 left-0 bg-muted/40"
            style={{ width: `${mediaShareOf(buffered, max) * 100}%` }}
          />
        )}
        <View
          className="absolute inset-y-0 left-0 bg-accent"
          style={{ width: `${share * 100}%` }}
        />
      </View>
      <View
        pointerEvents="none"
        className="absolute rounded-[var(--radius-pill)] bg-accent"
        style={{
          width: THUMB,
          height: THUMB,
          left: `${share * 100}%`,
          marginLeft: -THUMB / 2,
        }}
      />
    </View>
  );
}
