/**
 * Stackra file contract:
 * Purpose: the web `NumberField` on HeroUI v3's NumberField: one component that draws the label, the group with its
 *          decrement button, input and increment button, the description and the error message of a number field, maps
 *          the shared field contract (`isFullWidth` to `fullWidth`, one default each for `primary` and full width, the
 *          value `null` to React Aria's `NaN` for an empty field and back, `incrementLabel` and `decrementLabel` to the
 *          names of the two buttons, `hasSteppers` to whether they are drawn) and passes every other React Aria number
 *          field prop (`minValue`, `maxValue`, `step`, `formatOptions`, `isWheelDisabled`, `className`, `aria-label`)
 *          through to HeroUI's root.
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. The text is written and read with
 *           `Intl.NumberFormat` in the locale of React Aria's `I18nProvider`, which the DesignSystemProvider sets, so
 *           the grouping, the decimal mark and the digits follow the language. A typed value is clamped to the bounds
 *           when the field loses focus or Enter is pressed; the arrow keys, the Page keys and the mouse wheel step it
 *           with or without the buttons, and none of them changes a disabled or read-only field. A field without a
 *           visible `label` is named by the caller with `aria-label`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decision 9); ADR 0165 (UI contract, HeroUI
 *          v3 on web); ADR 0055 (forms: one field contract); owner decision 6 of STA-350 (thin wrappers).
 */
import { Description, FieldError, Label, NumberField as HeroNumberField } from "@heroui/react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { NumberFieldProps } from "#react/number-field/number-field.props";

/** React Aria's number for the contract's: `null` is an empty field, which it writes as `NaN`; `undefined` stays left out. */
const toAriaValue = (value: number | null | undefined): number | undefined =>
  value === null ? Number.NaN : value;

/**
 * A labelled number field with optional increment and decrement buttons. The value is a number, or `null` for an empty
 * field; `onChange` receives the new number, or `null` when the text is cleared or is not a number. Give `formatOptions`
 * for a percentage, a currency or a unit.
 */
export function NumberField({
  label,
  description,
  errorMessage,
  placeholder,
  variant = "primary",
  isFullWidth = true,
  hasSteppers = true,
  incrementLabel: incrementLabelProp,
  decrementLabel: decrementLabelProp,
  value,
  defaultValue,
  onChange,
  ...rest
}: NumberFieldProps) {
  const t = useUiText();
  const incrementLabel = incrementLabelProp ?? t(UI_KEYS.ui.number_field.increment);
  const decrementLabel = decrementLabelProp ?? t(UI_KEYS.ui.number_field.decrement);
  return (
    <HeroNumberField
      {...omitUndefined(rest)}
      {...omitUndefined({ value: toAriaValue(value), defaultValue: toAriaValue(defaultValue) })}
      variant={variant}
      fullWidth={isFullWidth}
      incrementAriaLabel={incrementLabel}
      decrementAriaLabel={decrementLabel}
      onChange={(next) => onChange?.(Number.isNaN(next) ? null : next)}
    >
      {label ? <Label>{label}</Label> : null}
      <HeroNumberField.Group>
        {hasSteppers ? <HeroNumberField.DecrementButton /> : null}
        <HeroNumberField.Input {...omitUndefined({ placeholder })} />
        {hasSteppers ? <HeroNumberField.IncrementButton /> : null}
      </HeroNumberField.Group>
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroNumberField>
  );
}
