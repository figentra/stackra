/**
 * Stackra file contract:
 * Purpose: `useSegmentThumb(selectedKey)`, the sliding marker under the chosen segment of a native SegmentedControl:
 *          the segments report their layout, and the marker slides to the chosen one's position and width over
 *          the theme's indicator step (ADR 0501), as the web's does.
 * Boundary: internal to the SegmentedControl. Layout `x` is physical, so the marker is placed from the physical left
 *           and is right in either direction. The first placement and reduced motion jump without the slide.
 * Runtime: react-native
 * Governing contract: ADR 0329 (motion layer); wave 3c mobile interactions (owner approval 2026-10-28).
 */
import { useCallback, useEffect, useRef } from "react";
import type { LayoutChangeEvent } from "react-native";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { SegmentThumb } from "#native/segmented-control/segment-thumb.type";

const INDICATOR = motionTiming(STACKRA_THEME, "indicator");

/** The slide: the indicator step's duration and curve. */
const SLIDE = Object.freeze({
  duration: INDICATOR.durationMs,
  easing: Easing.bezier(...(INDICATOR.bezier ?? [0, 0, 1, 1])),
});

/** The marker's animated style, and the layout handler each segment calls with its key. */
export function useSegmentThumb(selectedKey: string | undefined): SegmentThumb {
  const isReduced = useReducedMotion();
  const layouts = useRef(new Map<string, { x: number; width: number }>());
  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const isPlaced = useRef(false);

  const place = useCallback(
    (key: string | undefined) => {
      const layout = key === undefined ? undefined : layouts.current.get(key);
      if (!layout) return;
      const jump = isReduced || !isPlaced.current;
      x.set(jump ? layout.x : withTiming(layout.x, SLIDE));
      width.set(jump ? layout.width : withTiming(layout.width, SLIDE));
      isPlaced.current = true;
    },
    [isReduced, x, width],
  );

  useEffect(() => place(selectedKey), [selectedKey, place]);

  const onSegmentLayout = useCallback(
    (key: string, event: LayoutChangeEvent) => {
      const { x: left, width: wide } = event.nativeEvent.layout;
      layouts.current.set(key, { x: left, width: wide });
      if (key === selectedKey) place(key);
    },
    [selectedKey, place],
  );

  const thumbStyle = useAnimatedStyle(() => ({
    width: width.get(),
    transform: [{ translateX: x.get() }],
  }));
  return { thumbStyle, onSegmentLayout };
}
