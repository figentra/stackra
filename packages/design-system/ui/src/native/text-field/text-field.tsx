/**
 * Stackra file contract:
 * Purpose: the native `TextField` on HeroUI Native's TextField, Label, Input, Description and FieldError: one component
 *          that draws the label, the input, the description and the error message, maps the shared field contract
 *          (`onChange` to `onChangeText`, `isReadOnly` to `readOnly`, `type` to the keyboard, the masking and the
 *          capitalisation, a string `label` to the input's accessible name, `isFullWidth`, one default each for `primary`
 *          and full width) and passes every other React Native text input prop through to the input.
 * Boundary: no styling of its own beyond `self-start` when the field is not full width; the look is HeroUI Native's.
 *           `className` styles the root, not the input, so a caller lays the field out as on web. A text input has no
 *           required state to announce and no form name, so `isRequired` is the label's asterisk only and `name` is the
 *           key a form adapter binds; neither reaches the input. As on web, the description is hidden while the field
 *           is invalid, so the error replaces it.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (HeroUI Native on native); ADR 0055
 *          (forms: one field contract); owner decision 6 of STA-350 (thin wrappers).
 */
import { Description, FieldError, Input, Label, TextField as HeroTextField } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import type { TextInputProps } from "react-native";

import type { TextFieldType } from "#contracts/enums/text-field-type.enum";
import type { TextFieldContractProps } from "#contracts/types/text-field-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the native TextField: the shared contract plus HeroUI Native's input props, passed through to the input.
 * The contract's names replace HeroUI's and React Native's: `onChange` for `onChangeText`, `isReadOnly` for `readOnly`
 * and `editable`, `isDisabled` and `isInvalid` for the input's own.
 */
export type TextFieldProps = TextFieldContractProps &
  Omit<
    ComponentPropsWithRef<typeof Input>,
    keyof TextFieldContractProps | "children" | "onChangeText" | "readOnly" | "editable"
  >;

/**
 * The keyboard, masking and capitalisation each kind of text needs: what the web input's `type` does for free.
 * A caller's own `keyboardType` or `secureTextEntry` is spread after these and wins.
 */
export const TEXT_INPUT_TYPE_PROPS: Readonly<Record<TextFieldType, TextInputProps>> = Object.freeze(
  {
    text: {},
    email: {
      keyboardType: "email-address",
      autoCapitalize: "none",
      autoComplete: "email",
      autoCorrect: false,
    },
    password: {
      secureTextEntry: true,
      autoCapitalize: "none",
      autoComplete: "password",
      autoCorrect: false,
    },
    tel: { keyboardType: "phone-pad", autoComplete: "tel" },
    url: { keyboardType: "url", autoCapitalize: "none", autoCorrect: false },
  },
);

/**
 * A labelled single-line text field. A field without a string `label` needs an `accessibilityLabel`. Pair `value` with
 * `onChange` to control it, or give `defaultValue` and let it keep its own text; `onChange` receives the new string.
 */
export function TextField({
  label,
  description,
  errorMessage,
  placeholder,
  variant = "primary",
  type = "text",
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
}: TextFieldProps) {
  return (
    <HeroTextField
      {...omitUndefined({ isRequired, isInvalid, isDisabled })}
      className={[isFullWidth ? "" : "self-start", className].filter(Boolean).join(" ")}
    >
      {label == null ? null : <Label>{label}</Label>}
      <Input
        {...TEXT_INPUT_TYPE_PROPS[type]}
        accessibilityLabel={accessibilityLabel ?? (typeof label === "string" ? label : undefined)}
        placeholder={placeholder}
        variant={variant}
        value={value}
        defaultValue={defaultValue}
        onChangeText={onChange}
        readOnly={isReadOnly}
        {...rest}
      />
      {description == null ? null : <Description hideOnInvalid>{description}</Description>}
      {errorMessage == null ? null : <FieldError>{errorMessage}</FieldError>}
    </HeroTextField>
  );
}
