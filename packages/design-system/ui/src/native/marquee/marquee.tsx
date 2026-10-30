/**
 * Stackra file contract:
 * Purpose: the native `Marquee`: a strip whose content scrolls on a seamless loop (two copies on a row moved by a
 *          Reanimated frame callback, `speed` points a second) toward the reading start: leftward in English,
 *          rightward in Arabic. A pause button stops and resumes it where it was.
 * Boundary: the second copy is hidden from screen readers. Under Reduce Motion nothing moves: one copy wrapped onto
 *           lines and no pause button (WCAG 2.2.2).
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.2.2; STA-1371 (wave D, owner
 *          approval 2026-10-30).
 */
import { Pause, Play } from "@stackra/icons/native/lucide-icons";
import { type ReactElement, useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
} from "react-native-reanimated";

import { LONG_TAIL_KEYS } from "#core/constants/long-tail-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { useDirection } from "#native/bidi/use-direction";
import { IconButton } from "#native/icon-button/icon-button";
import type { MarqueeProps } from "#native/marquee/marquee.props";

/** The marquee's words. */
const K = LONG_TAIL_KEYS.ui.marquee;

/** One copy of the content; the trailing padding is the seam between copies. */
const COPY = "flex-row items-center gap-8 pe-8";

/** A strip whose content scrolls in a seamless loop, with a button to pause it. */
export function Marquee({ children, label, speed = 40, className }: MarqueeProps): ReactElement {
  const t = useUiText();
  const isReduced = useReducedMotion();
  const sign = useDirection() === "rtl" ? 1 : -1;
  const [isPaused, setIsPaused] = useState(false);
  const offset = useSharedValue(0);
  const copyWidth = useSharedValue(0);
  const frame = useFrameCallback((info) => {
    const width = copyWidth.get();
    if (width === 0) return;
    const step = ((info.timeSincePreviousFrame ?? 0) / 1000) * speed;
    offset.set((offset.get() + step) % width);
  }, false);
  useEffect(() => {
    frame.setActive(!isReduced && !isPaused);
  }, [frame, isReduced, isPaused]);
  const moving = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() * sign }] }));

  if (isReduced) {
    return (
      <View
        accessibilityLabel={label}
        className={["flex-row flex-wrap items-center gap-x-8 gap-y-3", className]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </View>
    );
  }
  return (
    <View
      accessibilityLabel={label}
      className={["w-full flex-row items-center gap-2", className].filter(Boolean).join(" ")}
    >
      <View className="flex-1 overflow-hidden">
        <Animated.View style={moving} className="flex-row self-start">
          <View
            className={COPY}
            onLayout={(event) => copyWidth.set(event.nativeEvent.layout.width)}
          >
            {children}
          </View>
          <View
            className={COPY}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {children}
          </View>
        </Animated.View>
      </View>
      <IconButton
        icon={isPaused ? <Play size={16} /> : <Pause size={16} />}
        label={t(isPaused ? K.play : K.pause)}
        variant="ghost"
        size="sm"
        onPress={() => setIsPaused((paused) => !paused)}
      />
    </View>
  );
}
