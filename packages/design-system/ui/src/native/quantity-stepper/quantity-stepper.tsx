/**
 * Stackra file contract:
 * Purpose: the native `QuantityStepper`: a soft pill of a minus IconButton, the count and a plus IconButton, the count
 *          popping in on each change; at the minimum the minus becomes a remove (trash) button when `onRemove` is
 *          given, else it is refused, and plus is refused at the maximum. The count is read with its name and
 *          announced politely.
 * Boundary: builds on `#native/icon-button/icon-button` (its press haptic included). The row follows the reading
 *           direction, so minus sits at the reading start. Reduced motion drops the pop.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); wave 3c mobile interactions (owner approval 2026-10-28).
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { cn } from "heroui-native";
import { View } from "react-native";
import Animated, { ReduceMotion, ZoomIn } from "react-native-reanimated";
import type { ReactElement } from "react";

import { useQuantityStepperState } from "#react/hooks/use-quantity-stepper-state";
import { IconButton } from "#native/icon-button/icon-button";
import type { QuantityStepperProps } from "#native/quantity-stepper/quantity-stepper.props";
import { Text } from "#native/text/text";

const FAST = motionTiming(STACKRA_THEME, "fast");

/** A compact minus, count, plus pill. */
export function QuantityStepper({
  value,
  defaultValue,
  onChange,
  minValue = 0,
  maxValue,
  step = 1,
  label,
  onRemove,
  incrementLabel,
  decrementLabel,
  removeLabel,
  size = "md",
  isDisabled = false,
  className,
  ...rest
}: QuantityStepperProps): ReactElement {
  const { count, decrement, increment } = useQuantityStepperState({
    value,
    defaultValue,
    onChange,
    minValue,
    maxValue,
    step,
    onRemove,
    incrementLabel,
    decrementLabel,
    removeLabel,
    isDisabled,
  });

  return (
    <View
      {...rest}
      className={
        cn(
          "flex-row items-center gap-1 self-start rounded-[var(--radius-pill)] bg-default p-1",
          className,
        ) ?? ""
      }
    >
      <IconButton size="sm" variant="ghost" {...decrement} />
      <Animated.View
        key={count}
        entering={ZoomIn.duration(FAST.durationMs).reduceMotion(ReduceMotion.System)}
        accessible
        accessibilityLabel={`${label}: ${count}`}
        accessibilityLiveRegion="polite"
      >
        <Text
          type={size === "lg" ? "body" : "small"}
          className="min-w-8 text-center font-semibold"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {count}
        </Text>
      </Animated.View>
      <IconButton size="sm" variant="ghost" icon="plus" {...increment} />
    </View>
  );
}
