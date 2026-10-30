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
import { useState } from "react";
import { View } from "react-native";
import Animated, { ReduceMotion, ZoomIn } from "react-native-reanimated";
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
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
  const t = useUiText();
  const [ownCount, setOwnCount] = useState(defaultValue ?? minValue);
  const count = value ?? ownCount;
  const set = (next: number) => {
    setOwnCount(next);
    onChange?.(next);
  };
  const isAtMin = count <= minValue;
  const isAtMax = maxValue !== undefined && count >= maxValue;
  const removes = isAtMin && onRemove !== undefined;

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
      <IconButton
        size="sm"
        variant="ghost"
        icon={removes ? "trash" : "minus"}
        label={
          removes
            ? (removeLabel ?? t(UI_KEYS.ui.quantity_stepper.remove))
            : (decrementLabel ?? t(UI_KEYS.ui.number_field.decrement))
        }
        isDisabled={isDisabled || (isAtMin && !removes)}
        onPress={() => (removes ? onRemove() : set(Math.max(minValue, count - step)))}
      />
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
      <IconButton
        size="sm"
        variant="ghost"
        icon="plus"
        label={incrementLabel ?? t(UI_KEYS.ui.number_field.increment)}
        isDisabled={isDisabled || isAtMax}
        onPress={() =>
          set(maxValue === undefined ? count + step : Math.min(maxValue, count + step))
        }
      />
    </View>
  );
}
