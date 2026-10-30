/**
 * Stackra file contract:
 * Purpose: the native `Checkbox` on HeroUI Native's ControlField and Checkbox: maps the shared field contract (`value`
 *          to `isSelected`, `onChange` with the new state, `defaultValue` held in state because HeroUI Native's field is
 *          controlled only) and draws the box, its label, description and error message in one pressable row; every
 *          other ControlField prop passes through.
 * Boundary: no styling of its own beyond the row's layout. Documented adaptations, where HeroUI Native has no
 *          equivalent: `isIndeterminate` draws a bar in the box and reports `mixed`; `isReadOnly` refuses the press
 *          (React Native has no read-only state to announce); `name` is accepted for a form adapter but native has no
 *          form to submit. The row is the one accessible `checkbox` and the inner box is hidden from VoiceOver and
 *          TalkBack, so the control is not read twice.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0303 (decision 7); ADR 0055
 *          (forms); owner decision 6 of STA-350 (thin wrappers).
 */
import {
  Checkbox as HeroCheckbox,
  ControlField,
  Description,
  FieldError,
  Label,
} from "heroui-native";
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { haptics } from "#native/haptics/haptics";
import type { CheckboxProps } from "#native/checkbox/checkbox.props";

/**
 * A box that is checked or not, in a row that is pressable end to end. `label` names it; `description` and
 * `errorMessage` sit under it and are read out with it.
 */
export function Checkbox({
  label,
  description,
  errorMessage,
  value,
  defaultValue = false,
  onChange,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  isIndeterminate,
  variant,
  name,
  className,
  accessibilityState,
  ...rest
}: CheckboxProps): ReactElement {
  const [held, setHeld] = useState(defaultValue);
  const isSelected = value ?? held;
  // The name only keys a web form's submission and a form adapter's binding; there is nothing to submit on native.
  void name;
  const change = (next: boolean) => {
    if (isReadOnly) return;
    haptics.play("selection");
    setHeld(next);
    onChange?.(next);
  };
  return (
    <ControlField
      {...rest}
      {...omitUndefined({ isRequired, isInvalid, isDisabled })}
      // oxlint-disable-next-line jsx-a11y/role-has-required-aria-props -- reason: React Native reports the checked state through accessibilityState
      role="checkbox"
      accessibilityState={{
        ...accessibilityState,
        checked: isIndeterminate ? "mixed" : isSelected,
        disabled: isDisabled === true,
      }}
      isSelected={isSelected}
      onSelectedChange={change}
      className={["flex-col items-start gap-1", className].filter(Boolean).join(" ")}
    >
      <View className="w-full flex-row items-start gap-3">
        <ControlField.Indicator
          className="mt-0.5"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          // The row takes every press, so the box and the row always agree on what the next state is.
          pointerEvents="none"
        >
          <HeroCheckbox
            {...omitUndefined({ variant })}
            // The bar of a partly checked parent: the box paints as checked and the check mark gives way to it.
            isSelected={isIndeterminate || isSelected}
          >
            {isIndeterminate ? (
              <HeroCheckbox.Indicator>
                <View className="bg-accent-foreground h-0.5 w-2.5 rounded-[var(--radius-pill)]" />
              </HeroCheckbox.Indicator>
            ) : undefined}
          </HeroCheckbox>
        </ControlField.Indicator>
        <View className="flex-1">
          {label ? <Label>{label}</Label> : null}
          {description ? <Description>{description}</Description> : null}
        </View>
      </View>
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </ControlField>
  );
}
