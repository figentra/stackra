/**
 * Stackra file contract:
 * Purpose: the native `ProgressBar`, the adapted form HeroUI Native documents it has no component for: a track and a
 *          fill drawn as React Native views in the theme's colours (`useThemeColor`) and animated with
 *          react-native-reanimated, on the same contract as the web bar. A determinate bar eases to its value; an
 *          indeterminate one sweeps a segment along the track from the inline start. It is one accessible `progressbar`
 *          with its range, value and text (`accessibilityValue`), and an indeterminate one is also `busy`.
 * Boundary: honours reduced motion: the fill jumps to its value and an indeterminate bar rests as a static segment at
 *          the start. Needs the native DesignSystemProvider for the locale and the direction (the sweep and the fill
 *          start at the right in Arabic). The track and fill carry no class, so they need no Uniwind scan.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0165 (HeroUI Native on native);
 *          WCAG 2.2 SC 2.3.3 and 4.1.2.
 */
import { useThemeColor } from "heroui-native";
import { useEffect, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { PROGRESS_FILL_ROLE } from "#core/constants/progress-fill-role.constant";
import { progressStateOf } from "#core/functions/progress-state-of.function";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { Text } from "#native/text/text";
import type { ProgressBarProps } from "#native/progress-bar/progress-bar.props";

/** The track's height in points for each size: HeroUI's `h-1`, `h-2` and `h-3` on web. */
const TRACK_HEIGHT = Object.freeze({ sm: 4, md: 8, lg: 12 } as const);

/** The track's corner radius for each size: HeroUI's `rounded-xs`, `rounded-sm` and `rounded-md` on web. */
const TRACK_RADIUS = Object.freeze({ sm: 2, md: 4, lg: 6 } as const);

/** The indeterminate segment's share of the track, as on web. */
const SEGMENT = 0.4;

/** How long the fill takes to reach a new value, in milliseconds, as on web. */
const EASE_MS = 300;

/** How long one indeterminate sweep takes, in milliseconds, as on web. */
const SWEEP_MS = 1500;

/**
 * A bar that fills as work completes: pass `value` for a determinate one, leave it out for an indeterminate sweep.
 * It is always one named `progressbar`; `label` is its name, drawn above the bar with `isLabelVisible`.
 */
export function ProgressBar({
  value,
  minValue = 0,
  maxValue = 100,
  size = "md",
  tone = "accent",
  label,
  valueLabel,
  isLabelVisible = false,
  isValueVisible = false,
  style,
  ...rest
}: ProgressBarProps) {
  const { locale, direction } = useDesignSystem();
  const { percentage, valueText, accessibilityValue } = progressStateOf({
    value,
    minValue,
    maxValue,
    valueLabel,
    locale,
  });
  const isIndeterminate = percentage === undefined;
  const isReducedMotion = useReducedMotion();
  const [fillColor, trackColor] = useThemeColor([PROGRESS_FILL_ROLE[tone], "default"] as const);
  const [trackWidth, setTrackWidth] = useState(0);
  const filled = useSharedValue(percentage ?? 0);
  const sweep = useSharedValue(0);
  // A transform is physical, so in a right-to-left layout the sweep runs the other way to start at the inline start.
  const sign = direction === "rtl" ? -1 : 1;

  // Ease to the new value, or jump when the user has asked for less motion.
  useEffect(() => {
    if (percentage === undefined) return;
    filled.set(isReducedMotion ? percentage : withTiming(percentage, { duration: EASE_MS }));
  }, [percentage, isReducedMotion, filled]);

  // Sweep while indeterminate; a still segment at the start is the reduced-motion form.
  useEffect(() => {
    if (!isIndeterminate || isReducedMotion) return;
    sweep.set(0);
    sweep.set(
      withRepeat(
        withTiming(1, { duration: SWEEP_MS, easing: Easing.bezier(0.65, 0, 0.35, 1) }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(sweep);
  }, [isIndeterminate, isReducedMotion, sweep]);

  const fillStyle = useAnimatedStyle(() =>
    isIndeterminate
      ? {
          width: trackWidth * SEGMENT,
          transform: [
            {
              translateX: isReducedMotion
                ? 0
                : sign *
                  interpolate(
                    sweep.get(),
                    [0, 1],
                    [-SEGMENT * trackWidth, (1 + SEGMENT) * trackWidth],
                  ),
            },
          ],
        }
      : { width: `${filled.get()}%`, transform: [{ translateX: 0 }] },
  );

  const onTrackLayout = (event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width);

  return (
    <View
      {...rest}
      style={style}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: isIndeterminate }}
      {...(accessibilityValue ? { accessibilityValue } : {})}
    >
      {isLabelVisible || (isValueVisible && valueText !== undefined) ? (
        <View style={{ flexDirection: "row", marginBottom: 4 }}>
          {isLabelVisible ? <Text type="small">{label}</Text> : null}
          {isValueVisible && valueText !== undefined ? (
            <Text type="small" style={{ marginStart: "auto" }}>
              {valueText}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View
        onLayout={onTrackLayout}
        style={{
          flexDirection: "row",
          justifyContent: "flex-start",
          overflow: "hidden",
          height: TRACK_HEIGHT[size],
          borderRadius: TRACK_RADIUS[size],
          backgroundColor: trackColor,
        }}
      >
        <Animated.View
          style={[
            { height: "100%", borderRadius: TRACK_RADIUS[size], backgroundColor: fillColor },
            fillStyle,
          ]}
        />
      </View>
    </View>
  );
}
