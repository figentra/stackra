/**
 * Stackra file contract:
 * Purpose: the native `StatusIndicator`: a state's name after a shape-coded icon in the state's theme colour (default a
 *          dashed ring, accent a dotted square, success a ringed check, warning a triangle, danger an octagon), so the
 *          state reads without colour; the shape pulses on the UI thread while `isAttention` is set, unless the system
 *          reduces motion.
 * Boundary: the shape is hidden from screen readers; the row reads as its text. No haptic: a pulse is not an event.
 * Runtime: react-native
 * Governing contract: gap inventory row 30 (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 1.4.1.
 */
import type { Tone } from "@stackra/contracts";
import {
  CircleCheck,
  CircleDashed,
  OctagonX,
  SquareDot,
  TriangleAlert,
} from "@stackra/icons/native/lucide-icons";
import { useThemeColor } from "heroui-native";
import type { LucideIcon } from "lucide-react-native";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { ReactElement } from "react";

import { ICON_SIZES } from "#core/constants/icon-sizes.constant";
import { STATUS_DOT_ROLE } from "#core/constants/status-dot-role.constant";
import { SlotIcon } from "#native/slot-icon/slot-icon";
import { Text } from "#native/text/text";
import type { StatusIndicatorProps } from "#native/status-indicator/status-indicator.props";

/** The shape of each tone: every one differs in outline, not only in colour. */
const SHAPE: Readonly<Record<Tone, LucideIcon>> = Object.freeze({
  default: CircleDashed,
  accent: SquareDot,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: OctagonX,
});

/** Half of one pulse, in ms: fade and swell, then back. */
const HALF_PULSE = 600;

/** A state as colour, shape and text together, pulsing when it needs attention. */
export function StatusIndicator({
  tone = "default",
  icon,
  isAttention = false,
  size = "md",
  children,
  ...rest
}: StatusIndicatorProps): ReactElement {
  const color = useThemeColor(STATUS_DOT_ROLE[tone]);
  const isReduced = useReducedMotion();
  const pulse = useSharedValue(0);
  const pulses = isAttention && !isReduced;

  useEffect(() => {
    if (!pulses) {
      cancelAnimation(pulse);
      pulse.set(0);
      return;
    }
    pulse.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: HALF_PULSE }),
          withTiming(0, { duration: HALF_PULSE }),
        ),
        -1,
      ),
    );
  }, [pulses, pulse]);

  const shapeStyle = useAnimatedStyle(() => ({
    opacity: 1 - pulse.get() * 0.55,
    transform: [{ scale: 1 + pulse.get() * 0.15 }],
  }));

  const Shape = SHAPE[tone];
  return (
    <View {...rest} className="flex-row items-center gap-1.5">
      <Animated.View
        style={shapeStyle}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {icon === undefined ? (
          <Shape size={ICON_SIZES[size]} color={color} />
        ) : (
          <SlotIcon icon={icon} />
        )}
      </Animated.View>
      <Text type={size === "sm" ? "small" : "body"}>{children}</Text>
    </View>
  );
}
