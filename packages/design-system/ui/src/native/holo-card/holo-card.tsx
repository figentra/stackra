/**
 * Stackra file contract:
 * Purpose: the native `HoloCard`: a card that tilts toward the finger in 3D on the UI thread, with a soft glare that
 *          follows it and springs back on release.
 * Boundary: Reanimated shared values and an animated style; the glare is decorative and hidden from assistive
 *           technology. Still under Reduce Motion or `isStill`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); WCAG 2.2 SC 2.3.3; STA-1371.
 */
import { type ReactElement, useState } from "react";
import { type GestureResponderEvent, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import type { HoloCardProps } from "#native/holo-card/holo-card.props";

/** The glare's diameter. */
const GLARE = 220;

/** A tilting card with a glare. */
export function HoloCard({
  children,
  maxTilt = 10,
  isStill = false,
  className,
}: HoloCardProps): ReactElement {
  const isReduced = useReducedMotion();
  const isLive = !isStill && !isReduced;
  const [size, setSize] = useState({ width: 1, height: 1 });
  const x = useSharedValue(0.5);
  const y = useSharedValue(0.5);
  const on = useSharedValue(0);
  const card = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${(0.5 - y.value) * 2 * maxTilt}deg` },
      { rotateY: `${(x.value - 0.5) * 2 * maxTilt}deg` },
    ],
  }));
  const glare = useAnimatedStyle(() => ({
    opacity: on.value * 0.35,
    transform: [
      { translateX: x.value * size.width - GLARE / 2 },
      { translateY: y.value * size.height - GLARE / 2 },
    ],
  }));
  const move = (event: GestureResponderEvent) => {
    x.set(Math.min(1, Math.max(0, event.nativeEvent.locationX / size.width)));
    y.set(Math.min(1, Math.max(0, event.nativeEvent.locationY / size.height)));
    on.set(withSpring(1));
  };
  const release = () => {
    x.set(withSpring(0.5));
    y.set(withSpring(0.5));
    on.set(withSpring(0));
  };
  return (
    <Animated.View
      onLayout={(event) =>
        setSize({
          width: event.nativeEvent.layout.width || 1,
          height: event.nativeEvent.layout.height || 1,
        })
      }
      {...(isLive
        ? { onTouchStart: move, onTouchMove: move, onTouchEnd: release, onTouchCancel: release }
        : {})}
      className={[
        "overflow-hidden rounded-[var(--radius-container)] bg-surface shadow-lg",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={isLive ? card : undefined}
    >
      {children}
      {isLive ? (
        <View
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          className="absolute inset-0"
        >
          <Animated.View
            className="absolute left-0 top-0 rounded-[var(--radius-pill)] bg-white"
            style={[{ width: GLARE, height: GLARE }, glare]}
          />
        </View>
      ) : null}
    </Animated.View>
  );
}
