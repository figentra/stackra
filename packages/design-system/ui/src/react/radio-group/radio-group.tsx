/**
 * Stackra file contract:
 * Purpose: the web `RadioGroup` on HeroUI v3's RadioGroup and Radio (React Aria): a labelled set of radios of which
 *          one is chosen, whose value is the chosen key. Each of `options` becomes a HeroUI radio, with the group's
 *          own label, description and error message around them; every other HeroUI prop passes through.
 * Boundary: no styling of its own. The group is a `radiogroup` named by its label, so a group with none takes
 *          `aria-label`. Arrow keys move and choose, as the platform's radios do. Options are data, not children, so
 *          the same list draws the same group on native.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0303 (decision 7);
 *          ADR 0055 (forms); owner decision 6 of STA-350 (thin wrappers).
 */
import { Description, FieldError, Label, Radio, RadioGroup as HeroRadioGroup } from "@heroui/react";
import type { RadioGroupRootProps } from "@heroui/react";

import type { RadioGroupContractProps } from "#contracts/types/radio-group-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the web RadioGroup: the shared contract plus HeroUI v3's own group props, passed through unchanged.
 * HeroUI's `children` is refused: the options are the content.
 */
export type RadioGroupProps = RadioGroupContractProps &
  Omit<RadioGroupRootProps, keyof RadioGroupContractProps | "children">;

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
  orientation,
  variant,
  name,
  ...rest
}: RadioGroupProps) {
  return (
    <HeroRadioGroup
      {...rest}
      // An empty value is "nothing chosen", which React Aria spells `null`: given "", it looks for a radio of that value,
      // finds none and leaves no radio in the tab order.
      {...(value === "" ? { value: null } : {})}
      {...omitUndefined({
        value: value === "" ? undefined : value,
        defaultValue,
        onChange,
        isRequired,
        isInvalid,
        isDisabled,
        isReadOnly,
        orientation,
        variant,
        name,
      })}
    >
      {label ? (
        <Label {...omitUndefined({ isRequired, isInvalid, isDisabled })}>{label}</Label>
      ) : null}
      {options.map((option) => (
        <Radio
          key={option.value}
          value={option.value}
          {...omitUndefined({ isDisabled: option.isDisabled })}
        >
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            <Label {...omitUndefined({ isDisabled: isDisabled || option.isDisabled })}>
              {option.label}
            </Label>
          </Radio.Content>
          {option.description ? <Description>{option.description}</Description> : null}
        </Radio>
      ))}
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroRadioGroup>
  );
}
