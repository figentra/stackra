/**
 * Stackra file contract:
 * Purpose: `HeroTicker`, a row of words drifting sideways without end (two copies of the row, the second taking the
 *          first's place), on the UI thread.
 * Boundary: decoration, hidden from assistive technology; it never mirrors, so it reads the same in either direction.
 * Runtime: react-native
 * Governing contract: owner decision 2026-10-28 (rotating landing heroes, concept C); WCAG 2.2 SC 2.2.2, 2.3.3.
 */
import { Text } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import type { HeroTickerProps } from "./hero-ticker.props";

/** Points per second the row drifts. */
const SPEED = 40;

/** An endless row of words. */
export function HeroTicker({ words, isStill }: HeroTickerProps) {
  const [width, setWidth] = useState(0);
  const offset = useSharedValue(0);
  useEffect(() => {
    if (isStill || width === 0) return;
    offset.set(0);
    offset.set(
      withRepeat(
        withTiming(-width, { duration: (width / SPEED) * 1000, easing: Easing.linear }),
        -1,
      ),
    );
    return () => cancelAnimation(offset);
  }, [isStill, offset, width]);
  const drift = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
  const row = (copy: number) => (
    <View
      key={copy}
      className="flex-row gap-8 pe-8"
      onLayout={copy === 0 ? (event) => setWidth(event.nativeEvent.layout.width) : undefined}
    >
      {words.map(({ text, lang }) => (
        <Text key={`${lang}-${text}`} lang={lang} tone="muted" className="text-lg">
          {text}
        </Text>
      ))}
    </View>
  );
  return (
    <View
      className="overflow-hidden"
      style={{ direction: "ltr" }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      <Animated.View className="flex-row self-start" style={drift}>
        {row(0)}
        {row(1)}
      </Animated.View>
    </View>
  );
}
