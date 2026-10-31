/**
 * Stackra file contract:
 * Purpose: the native `ProgressCircle`, the adapted form HeroUI Native documents it has no component for: a track
 *          circle and a fill arc drawn with react-native-svg in the theme's colours (`useThemeColor`) and animated with
 *          react-native-reanimated, on the same contract and with the same geometry as the web ring. A determinate ring
 *          eases to its value; an indeterminate one is a quarter arc that spins. It is one accessible `progressbar`
 *          with its range, value and text (`accessibilityValue`), and an indeterminate one is also `busy`.
 * Boundary: honours reduced motion: the arc jumps to its value and an indeterminate ring rests as a still quarter
 *          arc. Needs the native DesignSystemProvider for the locale. The ring never mirrors in right-to-left.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0165 (HeroUI Native on native);
 *          WCAG 2.2 SC 2.3.3 and 4.1.2.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useThemeColor } from "heroui-native";
import { useEffect, type ReactElement } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  createAnimatedComponent,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { PROGRESS_FILL_ROLE } from "#core/constants/progress-fill-role.constant";
import { progressStateOf } from "#core/functions/progress-state-of.function";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import type { ProgressCircleProps } from "#native/progress-circle/progress-circle.props";

/** The ring's diameter in points for each size: HeroUI's `size-5`, `size-7` and `size-9` on web. */
const DIAMETER = Object.freeze({ sm: 20, md: 28, lg: 36 } as const);

/** The ring's geometry in HeroUI's own 36-unit box: centre, stroke width and radius. */
const CENTER = 18;
const STROKE_WIDTH = 4;
const RADIUS = CENTER - STROKE_WIDTH / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** The share of the ring an indeterminate arc covers, as on web. */
const ARC = 0.25;

/** How long the arc takes to reach a new value, in milliseconds, as on web. */
const EASE_MS = motionTiming(STACKRA_THEME, "slow").durationMs;

/** How long one turn of an indeterminate ring takes, in milliseconds, as on web: the theme's one-second blink step. */
const TURN_MS = motionTiming(STACKRA_THEME, "blink").durationMs;

/** The fill circle as an animated component, so its dash offset can follow a shared value on the UI thread. */
const AnimatedCircle = createAnimatedComponent(Circle);

/**
 * A ring that fills as work completes: pass `value` for a determinate one, leave it out for an indeterminate
 * spinning arc. It is always one named `progressbar`, and unlike a Spinner it can say how far along the work is.
 */
export function ProgressCircle({
  value,
  minValue = 0,
  maxValue = 100,
  size = "md",
  tone = "accent",
  label,
  valueLabel,
  style,
  ...rest
}: ProgressCircleProps): ReactElement {
  const { locale } = useDesignSystem();
  const { percentage, accessibilityValue } = progressStateOf({
    value,
    minValue,
    maxValue,
    valueLabel,
    locale,
  });
  const isIndeterminate = percentage === undefined;
  const isReducedMotion = useReducedMotion();
  const [fillColor, trackColor] = useThemeColor([PROGRESS_FILL_ROLE[tone], "default"] as const);
  const filled = useSharedValue(percentage ?? 0);
  const turn = useSharedValue(0);
  const diameter = DIAMETER[size];

  // Ease to the new value, or jump when the user has asked for less motion.
  useEffect(() => {
    if (percentage === undefined) return;
    filled.set(isReducedMotion ? percentage : withTiming(percentage, { duration: EASE_MS }));
  }, [percentage, isReducedMotion, filled]);

  // Spin while indeterminate; a still arc is the reduced-motion form.
  useEffect(() => {
    if (!isIndeterminate || isReducedMotion) return;
    turn.set(0);
    turn.set(withRepeat(withTiming(1, { duration: TURN_MS, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(turn);
  }, [isIndeterminate, isReducedMotion, turn]);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: isIndeterminate
      ? CIRCUMFERENCE * (1 - ARC)
      : CIRCUMFERENCE - (filled.get() / 100) * CIRCUMFERENCE,
  }));

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${isIndeterminate && !isReducedMotion ? turn.get() * 360 : 0}deg` }],
  }));

  return (
    <View
      {...rest}
      style={[{ width: diameter, height: diameter }, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: isIndeterminate }}
      {...(accessibilityValue ? { accessibilityValue } : {})}
    >
      <Animated.View style={[{ width: diameter, height: diameter }, spinStyle]}>
        <Svg
          width={diameter}
          height={diameter}
          viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}
          fill="none"
        >
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={trackColor}
            strokeWidth={STROKE_WIDTH}
          />
          <AnimatedCircle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={fillColor}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeLinecap="round"
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
            animatedProps={arcProps}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
