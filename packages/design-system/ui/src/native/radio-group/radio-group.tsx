/**
 * Stackra file contract:
 * Purpose: the native `RadioGroup` on HeroUI Native's RadioGroup, Item and Radio: a labelled set of radios of which
 *          one is chosen, whose value is the chosen key. Each of `options` becomes a HeroUI Native item with its label,
 *          description and radio, with the group's own label, description and error message around them; every other
 *          HeroUI Native group prop passes through. `value` and `defaultValue` map to HeroUI Native's controlled-only
 *          `value`, `defaultValue` being held in state.
 * Boundary: no styling of its own beyond the row layout of `orientation="horizontal"`. Documented adaptations, where
 *          HeroUI Native has no equivalent: `isReadOnly` refuses the press (React Native has no read-only state to
 *          announce); `isRequired` shows the label's asterisk only; `name` is accepted for a form adapter but native
 *          has no form to submit; `orientation` is a layout class, as HeroUI Native documents. The group is a
 *          `radiogroup` named by its string label, or by `aria-labelledby` where the platform supports it.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0303 (decision 7); ADR 0055
 *          (forms); owner decision 6 of STA-350 (thin wrappers).
 */
import { Description, FieldError, Label, Radio, RadioGroup as HeroRadioGroup } from "heroui-native";
import { useId, useState } from "react";
import { View } from "react-native";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { RadioGroupProps } from "#native/radio-group/radio-group.props";

/**
 * A set of radios of which at most one is chosen; the group reports the chosen option's `value`. `isDisabled` and
 * `isReadOnly` apply to the whole group; an option's own `isDisabled` to it alone.
 */
export function RadioGroup({
  options,
  label,
  description,
  errorMessage,
  value,
  defaultValue,
  onChange,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  orientation = "vertical",
  variant,
  name,
  ...rest
}: RadioGroupProps) {
  const labelId = useId();
  const [held, setHeld] = useState(defaultValue);
  // The name only keys a web form's submission and a form adapter's binding; there is nothing to submit on native.
  void name;
  const change = (next: string) => {
    if (isReadOnly) return;
    setHeld(next);
    onChange?.(next);
  };
  return (
    <HeroRadioGroup
      accessibilityLabel={typeof label === "string" ? label : undefined}
      aria-labelledby={label ? labelId : undefined}
      {...rest}
      {...omitUndefined({ isDisabled, isInvalid, variant })}
      value={value ?? held}
      onValueChange={change}
    >
      {label ? (
        <Label nativeID={labelId} {...omitUndefined({ isRequired, isInvalid, isDisabled })}>
          {label}
        </Label>
      ) : null}
      <View {...(orientation === "horizontal" ? { className: "flex-row flex-wrap gap-x-4" } : {})}>
        {options.map((option) => (
          <HeroRadioGroup.Item
            key={option.value}
            value={option.value}
            {...omitUndefined({ isDisabled: option.isDisabled })}
          >
            <View className="flex-1">
              <Label>{option.label}</Label>
              {option.description ? <Description>{option.description}</Description> : null}
            </View>
            <Radio />
          </HeroRadioGroup.Item>
        ))}
      </View>
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroRadioGroup>
  );
}
