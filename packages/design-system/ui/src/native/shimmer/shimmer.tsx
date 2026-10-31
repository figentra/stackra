/**
 * Stackra file contract:
 * Purpose: the native `Shimmer`: "Thinking…" (or the caller's words) in muted text with a brighter band sweeping across
 *          it in the reading direction, left to right in English and right to left in Arabic; or, as `block`, lines of
 *          Skeleton placeholders while an answer loads.
 * Boundary: the band is a moving window that shows a second, full-colour copy of the same platform Text, so Arabic is
 *           always shaped by the platform (never drawn by Skia or SVG) and the copy is hidden from assistive technology.
 *           Under reduced motion the text is static and muted. The block kind composes SkeletonGroup and Skeleton.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.3.3, 4.1.3; STA-1371 (wave D, owner approval 2026-10-30).
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useEffect, useState, type ReactElement } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { AI_CHAT_KEYS } from "#core/constants/ai-chat-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import type { ShimmerProps } from "#native/shimmer/shimmer.props";
import { Skeleton } from "#native/skeleton/skeleton";
import { SkeletonGroup } from "#native/skeleton-group/skeleton-group";
import { Text } from "#native/text/text";

/** One sweep across the text, in milliseconds. */
const SWEEP_MS = motionTiming(STACKRA_THEME, "blink").durationMs * 2;

/** The band's width as a share of the text's width. */
const BAND = 0.4;

/** A loading shimmer over text, or placeholder lines. */
export function Shimmer({
  kind = "text",
  children,
  lines = 3,
  className,
}: ShimmerProps): ReactElement {
  const t = useUiText();
  const { direction } = useDesignSystem();
  const isReduced = useReducedMotion();
  const text = children ?? t(AI_CHAT_KEYS.ui.shimmer.thinking);
  const [width, setWidth] = useState(0);
  const offset = useSharedValue(0);
  const band = width * BAND;
  const isSweeping = kind === "text" && !isReduced && width > 0;

  useEffect(() => {
    if (!isSweeping) return;
    const [from, to] = direction === "rtl" ? [width, -band] : [-band, width];
    offset.set(from);
    offset.set(
      withRepeat(withTiming(to, { duration: SWEEP_MS, easing: Easing.linear }), -1, false),
    );
    return () => cancelAnimation(offset);
  }, [isSweeping, direction, width, band, offset]);

  const windowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }));
  const copyStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -offset.get() }] }));

  if (kind === "block") {
    const count = Math.max(1, lines);
    return (
      <SkeletonGroup loadingLabel={text} className={`gap-2 ${className ?? ""}`}>
        {Array.from({ length: count }, (_, index) => (
          <Skeleton
            // oxlint-disable-next-line react/no-array-index-key -- reason: placeholder lines have no identity but their place
            key={index}
            className={`h-3 ${index === count - 1 && count > 1 ? "w-3/5" : "w-full"}`}
          />
        ))}
      </SkeletonGroup>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={text}
      accessibilityLiveRegion="polite"
      className={`self-start ${className ?? ""}`}
    >
      <Text
        type="small"
        tone="muted"
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        {text}
      </Text>
      {isSweeping ? (
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            { position: "absolute", top: 0, bottom: 0, left: 0, width: band, overflow: "hidden" },
            windowStyle,
          ]}
        >
          <Animated.View style={[{ width }, copyStyle]}>
            <Text type="small">{text}</Text>
          </Animated.View>
        </Animated.View>
      ) : null}
    </View>
  );
}
