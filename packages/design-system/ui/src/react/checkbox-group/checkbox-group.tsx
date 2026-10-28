/**
 * Stackra file contract:
 * Purpose: the web `CheckboxGroup` on HeroUI v3's CheckboxGroup (React Aria): a labelled set of checkboxes whose
 *          value is the list of chosen keys. Each of `options` becomes a HeroUI checkbox in the group, with the
 *          group's own label, description and error message around them; every other HeroUI prop passes through.
 * Boundary: no styling of its own. The group is a `role="group"` named by its label, so a group with none takes
 *          `aria-label`. Options are data, not children, so the same list draws the same group on native.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0303 (decision 7);
 *          ADR 0055 (forms); owner decision 6 of STA-350 (thin wrappers).
 */
import type { ReactElement } from "react";
import {
  Checkbox as HeroCheckbox,
  CheckboxGroup as HeroCheckboxGroup,
  Description,
  FieldError,
  Label,
} from "@heroui/react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { CheckboxGroupProps } from "#react/checkbox-group/checkbox-group.props";

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
  defaultValue,
  onChange,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  variant,
  name,
  ...rest
}: CheckboxGroupProps): ReactElement {
  return (
    <HeroCheckboxGroup
      {...rest}
      {...omitUndefined({
        // React Aria's list is mutable; the contract's is read-only, so it is copied on the way in.
        value: value && [...value],
        defaultValue: defaultValue && [...defaultValue],
        onChange,
        isRequired,
        isInvalid,
        isDisabled,
        isReadOnly,
        variant,
        name,
      })}
    >
      {label ? (
        <Label {...omitUndefined({ isRequired, isInvalid, isDisabled })}>{label}</Label>
      ) : null}
      {options.map((option) => (
        <HeroCheckbox
          key={option.value}
          value={option.value}
          {...omitUndefined({ isDisabled: option.isDisabled })}
        >
          <HeroCheckbox.Content>
            <HeroCheckbox.Control>
              <HeroCheckbox.Indicator />
            </HeroCheckbox.Control>
            <Label {...omitUndefined({ isDisabled: isDisabled || option.isDisabled })}>
              {option.label}
            </Label>
          </HeroCheckbox.Content>
          {option.description ? <Description>{option.description}</Description> : null}
        </HeroCheckbox>
      ))}
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroCheckboxGroup>
  );
}
