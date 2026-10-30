/**
 * Stackra file contract:
 * Purpose: the web `QuantityStepper`: a soft pill of a minus IconButton, the count and a plus IconButton; at the minimum
 *          the minus becomes a remove (trash) button when `onRemove` is given, else it is refused, and plus is refused
 *          at the maximum. The count is a polite live region named by `label`.
 * Boundary: builds on `#react/icon-button/icon-button`. The row follows the reading direction, so minus sits at the
 *           reading start. For typed numbers use NumberField.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); wave 3c mobile interactions (owner approval 2026-10-28); WCAG 2.2
 *          SC 4.1.3.
 */
import type { ReactElement } from "react";
import { cn } from "@heroui/react";
import { useState } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import type { QuantityStepperProps } from "#react/quantity-stepper/quantity-stepper.props";

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
    <div
      {...rest}
      role="group"
      aria-label={label}
      data-slot="quantity-stepper"
      className={cn("inline-flex items-center gap-1 rounded-full bg-default p-1", className)}
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
      <output
        aria-live="polite"
        className={cn(
          "min-w-8 text-center font-semibold tabular-nums",
          size === "lg" ? "text-base" : "text-sm",
        )}
      >
        {count}
      </output>
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
    </div>
  );
}
