/**
 * Stackra file contract:
 * Purpose: the native `CheckboxGroup`, which HeroUI Native does not have, adapted on free parts: a labelled
 *          `group` view holding one native `Checkbox` per option, whose value is the list of chosen keys, with the
 *          group's own label, description and error message around them. `value` and `defaultValue` follow the
 *          contract; `defaultValue` is held in state.
 * Boundary: no styling of its own. Documented adaptations: `isReadOnly` refuses the press (React Native has no
 *          read-only state to announce); `isRequired` shows the label's asterisk only; `name` is accepted for a form
 *          adapter but native has no form to submit. The group is named by its string label, or by
 *          `aria-labelledby` where the platform supports it. Every other `View` prop passes through.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0303 (decision 7); ADR 0055
 *          (forms); owner decision 6 of STA-350 (thin wrappers).
 */
import { Description, FieldError, Label } from "heroui-native";
import { useId, useState, type ReactElement } from "react";
import { View } from "react-native";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Checkbox } from "#native/checkbox/checkbox";
import type { CheckboxGroupProps } from "#native/checkbox-group/checkbox-group.props";

/** One empty list for every render, so a default never changes identity. */
const NONE: readonly string[] = [];

/**
 * A set of checkboxes that edit one list of keys: the list holds the `value` of every checked option, in the order
 * they were checked. `isDisabled` and `isReadOnly` apply to the whole group; an option's own `isDisabled` to it alone.
 */
export function CheckboxGroup({
  options,
  label,
  description,
  errorMessage,
  value,
  defaultValue = NONE,
  onChange,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  variant,
  name,
  ...rest
}: CheckboxGroupProps): ReactElement {
  const labelId = useId();
  const [held, setHeld] = useState<readonly string[]>(defaultValue);
  const chosen = value ?? held;
  // The name only keys a web form's submission and a form adapter's binding; there is nothing to submit on native.
  void name;
  const toggle = (key: string, isChecked: boolean) => {
    if (isReadOnly) return;
    const next = isChecked ? [...chosen, key] : chosen.filter((item) => item !== key);
    setHeld(next);
    onChange?.(next);
  };
  return (
    <View
      accessibilityLabel={typeof label === "string" ? label : undefined}
      aria-labelledby={label ? labelId : undefined}
      {...rest}
      role="group"
      className={["gap-2", rest.className].filter(Boolean).join(" ")}
    >
      {label ? (
        <Label nativeID={labelId} {...omitUndefined({ isRequired, isInvalid, isDisabled })}>
          {label}
        </Label>
      ) : null}
      {options.map((option) => (
        <Checkbox
          key={option.value}
          label={option.label}
          description={option.description}
          value={chosen.includes(option.value)}
          onChange={(isChecked) => toggle(option.value, isChecked)}
          isDisabled={isDisabled === true || option.isDisabled === true}
          {...omitUndefined({ isInvalid, isReadOnly, variant })}
        />
      ))}
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? (
        <FieldError {...omitUndefined({ isInvalid })}>{errorMessage}</FieldError>
      ) : null}
    </View>
  );
}
