/**
 * Stackra file contract:
 * Purpose: the web `Checkbox` on HeroUI v3's Checkbox (React Aria): maps the shared field contract (`value` to
 *          `isSelected`, `defaultValue` to `defaultSelected`, `onChange` with the new state) and draws the control, its
 *          label, description and error message in HeroUI's own structure; every other HeroUI prop passes through.
 * Boundary: no styling of its own. The label is the accessible name, so a checkbox with none takes `aria-label`.
 *          HeroUI's string `value` (the key inside a group) is refused: a standalone checkbox's `value` is its state,
 *          and a group takes `options` instead.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0303 (decision 7);
 *          ADR 0055 (forms); owner decision 6 of STA-350 (thin wrappers).
 */
import { Checkbox as HeroCheckbox, Description, FieldError, Label } from "@heroui/react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { CheckboxProps } from "#react/checkbox/checkbox.props";

/**
 * A box that is checked or not. `label` names it; `description` and `errorMessage` sit under it and are read out
 * with it. With `isIndeterminate` it shows a dash and announces as mixed until the user presses it.
 */
export function Checkbox({
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
  isIndeterminate,
  variant,
  name,
  ...rest
}: CheckboxProps) {
  return (
    <HeroCheckbox
      {...rest}
      {...omitUndefined({
        isSelected: value,
        defaultSelected: defaultValue,
        onChange,
        isRequired,
        isInvalid,
        isDisabled,
        isReadOnly,
        isIndeterminate,
        variant,
        name,
      })}
    >
      <HeroCheckbox.Content>
        <HeroCheckbox.Control>
          <HeroCheckbox.Indicator />
        </HeroCheckbox.Control>
        {label ? (
          <Label {...omitUndefined({ isRequired, isInvalid, isDisabled })}>{label}</Label>
        ) : null}
      </HeroCheckbox.Content>
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroCheckbox>
  );
}
