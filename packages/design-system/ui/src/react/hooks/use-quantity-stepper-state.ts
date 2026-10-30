/**
 * Stackra file contract:
 * Purpose: `useQuantityStepperState(props)`, the state every runtime's QuantityStepper shares: the count (controlled or
 *          its own, starting at `defaultValue` or the minimum) and its two buttons. The minus button steps down to the
 *          minimum; at the minimum it becomes "remove" when the app gave `onRemove`, else it is disabled. The plus
 *          button steps up to the maximum, when there is one.
 * Boundary: a React hook with no rendering; the runtimes draw the pill and the count. The web and native
 *           QuantityStepper both use it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import { useState } from "react";

import type { QuantityStepperContractProps } from "#contracts/types/quantity-stepper-contract-props.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";

/** One of the stepper's buttons, ready to spread on an IconButton (the minus button names its icon too). */
interface StepperButton {
  readonly label: string;
  readonly isDisabled: boolean;
  readonly onPress: () => void;
}

/**
 * The shared QuantityStepper state.
 * @param props - the count, its bounds and step, the change and remove handlers, the button names and the disabled state
 * @returns the count and the minus and plus buttons
 */
export function useQuantityStepperState({
  value,
  defaultValue,
  onChange,
  minValue = 0,
  maxValue,
  step = 1,
  onRemove,
  incrementLabel,
  decrementLabel,
  removeLabel,
  isDisabled = false,
}: Omit<QuantityStepperContractProps, "label" | "size">): {
  readonly count: number;
  readonly decrement: StepperButton & { readonly icon: "trash" | "minus" };
  readonly increment: StepperButton;
} {
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
  return {
    count,
    decrement: {
      icon: removes ? "trash" : "minus",
      label: removes
        ? (removeLabel ?? t(UI_KEYS.ui.quantity_stepper.remove))
        : (decrementLabel ?? t(UI_KEYS.ui.number_field.decrement)),
      isDisabled: isDisabled || (isAtMin && !removes),
      onPress: () => (removes ? onRemove() : set(Math.max(minValue, count - step))),
    },
    increment: {
      label: incrementLabel ?? t(UI_KEYS.ui.number_field.increment),
      isDisabled: isDisabled || isAtMax,
      onPress: () => set(maxValue === undefined ? count + step : Math.min(maxValue, count + step)),
    },
  };
}
