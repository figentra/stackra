/**
 * Stackra file contract:
 * Purpose: the native `TextArea` on HeroUI Native's TextField, Label, TextArea, Description and FieldError: one
 *          component that draws the label, the multi-line input, the description and the error message, maps the shared
 *          field contract (`onChange` to `onChangeText`, `isReadOnly` to `readOnly`, `rows` to `numberOfLines`, a string
 *          `label` to the input's accessible name, `isFullWidth`, one default each for `primary` and full width) and
 *          passes every other React Native text input prop through to the input.
 * Boundary: no styling of its own beyond `self-start` when the field is not full width; the look is HeroUI Native's.
 *           `className` styles the root, not the input. `numberOfLines` sizes the area on Android only; iOS grows it with
 *           its text. A text input has no form name, so `name` is the key a form adapter binds and does not reach the
 *           input. As on web, the description is hidden while the field is invalid.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (HeroUI Native on native); ADR 0055
 *          (forms: one field contract); owner decision 6 of STA-350 (thin wrappers).
 */
import {
  Description,
  FieldError,
  Label,
  TextArea as HeroTextArea,
  TextField as HeroTextField,
} from "heroui-native";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { TextAreaProps } from "#native/text-area/text-area.props";

/**
 * A labelled multi-line text field. A field without a string `label` needs an `accessibilityLabel`. Pair `value` with
 * `onChange` to control it, or give `defaultValue` and let it keep its own text; `onChange` receives the new string.
 */
export function TextArea({
  label,
  description,
  errorMessage,
  placeholder,
  rows,
  variant = "primary",
  isFullWidth = true,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  value,
  defaultValue,
  onChange,
  // `name` is the form adapter's key; a native text input has no form to submit under it.
  name: _name,
  className,
  accessibilityLabel,
  ...rest
}: TextAreaProps) {
  return (
    <HeroTextField
      {...omitUndefined({ isRequired, isInvalid, isDisabled })}
      className={[isFullWidth ? "" : "self-start", className].filter(Boolean).join(" ")}
    >
      {label == null ? null : <Label>{label}</Label>}
      <HeroTextArea
        accessibilityLabel={accessibilityLabel ?? (typeof label === "string" ? label : undefined)}
        placeholder={placeholder}
        numberOfLines={rows}
        variant={variant}
        value={value}
        defaultValue={defaultValue}
        onChangeText={onChange}
        readOnly={isReadOnly}
        {...rest}
      />
      {description == null ? null : <Description hideOnInvalid>{description}</Description>}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroTextField>
  );
}
