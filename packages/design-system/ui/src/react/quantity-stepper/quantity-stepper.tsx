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

import { useQuantityStepperState } from "#react/hooks/use-quantity-stepper-state";
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
    <div
      {...rest}
      role="group"
      aria-label={label}
      data-slot="quantity-stepper"
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-default p-1",
        className,
      )}
    >
      <IconButton size="sm" variant="ghost" {...decrement} />
      <output
        aria-live="polite"
        className={cn(
          "min-w-8 text-center font-semibold tabular-nums",
          size === "lg" ? "text-base" : "text-sm",
        )}
      >
        {count}
      </output>
      <IconButton size="sm" variant="ghost" icon="plus" {...increment} />
    </div>
  );
}
