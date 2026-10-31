/**
 * Stackra file contract:
 * Purpose: `GrowBar`, one bar of a hero's chart: grown from its base on the UI thread, either once per `replay` (a new
 *          theme) or breathing between a third and its full height in a loop.
 * Boundary: decoration; the chart around it is hidden from assistive technology.
 * Runtime: react-native
 * Governing contract: owner decision 2026-10-28 (rotating landing heroes); WCAG 2.2 SC 2.3.3.
 */
import { motionEasing, motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useEffect } from "react";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import type { GrowBarProps } from "./grow-bar.props";

/** The heroes' ease-out: the theme's `enter` easing. */
const EASE = Easing.bezier(...motionEasing(STACKRA_THEME, "enter"));

/** The theme's pulse, in milliseconds: one grow on a replay, two per breath in the loop. */
const PULSE_MS = motionTiming(STACKRA_THEME, "pulse").durationMs;

/** A chart bar that grows from its base. */
export function GrowBar({ height, index, replay, className, isStill }: GrowBarProps) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (isStill) {
      scale.set(1);
      return;
    }
    if (replay === undefined) {
      scale.set(0.35);
      scale.set(
        withDelay(
          index * 120,
          withRepeat(withTiming(1, { duration: PULSE_MS * 2, easing: EASE }), -1, true),
        ),
      );
    } else {
      scale.set(0);
      scale.set(withDelay(index * 50, withTiming(1, { duration: PULSE_MS, easing: EASE })));
    }
    return () => cancelAnimation(scale);
  }, [index, isStill, replay, scale]);
  const grow = useAnimatedStyle(() => ({ transform: [{ scaleY: scale.value }] }));
  return (
    <Animated.View
      className={`flex-1 ${className}`}
      style={[{ height: `${height * 100}%`, transformOrigin: "bottom" }, grow]}
    />
  );
}
