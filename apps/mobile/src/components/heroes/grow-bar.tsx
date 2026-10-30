/**
 * Stackra file contract:
 * Purpose: `GrowBar`, one bar of a hero's chart: grown from its base on the UI thread, either once per `replay` (a new
 *          theme) or breathing between a third and its full height in a loop.
 * Boundary: decoration; the chart around it is hidden from assistive technology.
 * Runtime: react-native
 * Governing contract: owner decision 2026-10-28 (rotating landing heroes); WCAG 2.2 SC 2.3.3.
 */
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

/** The heroes' ease-out (CSS `cubic-bezier(.2,.8,.2,1)`). */
const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);

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
          withRepeat(withTiming(1, { duration: 2400, easing: EASE }), -1, true),
        ),
      );
    } else {
      scale.set(0);
      scale.set(withDelay(index * 50, withTiming(1, { duration: 1400, easing: EASE })));
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
