/**
 * Stackra file contract:
 * Purpose: `useSegmentThumb(selectedKey)`, the sliding marker under the chosen segment of a native SegmentedControl:
 *          the segments report their layout, and the marker springs to the chosen one's position and width.
 * Boundary: internal to the SegmentedControl. Layout `x` is physical, so the marker is placed from the physical left
 *           and is right in either direction. The first placement and reduced motion jump without the spring.
 * Runtime: react-native
 * Governing contract: ADR 0329 (motion layer); wave 3c mobile interactions (owner approval 2026-10-28).
 */
import { useCallback, useEffect, useRef } from "react";
import type { LayoutChangeEvent } from "react-native";
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import type { SegmentThumb } from "#native/segmented-control/segment-thumb.type";

/** A stiff, barely bouncing spring, so the marker lands quickly. */
const SPRING = Object.freeze({ damping: 22, stiffness: 260, mass: 0.8 });

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
      x.set(jump ? layout.x : withSpring(layout.x, SPRING));
      width.set(jump ? layout.width : withSpring(layout.width, SPRING));
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
