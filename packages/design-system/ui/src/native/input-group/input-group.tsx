/**
 * Stackra file contract:
 * Purpose: the native `InputGroup` on HeroUI Native's TextField, InputGroup, Label, Description and FieldError: one
 *          component that draws the label, an input with a prefix and a suffix, the description and the error message,
 *          maps the shared field contract exactly as the native `TextField` does (`onChange` to `onChangeText`,
 *          `isReadOnly` to `readOnly`, `type` to the keyboard, a string `label` to the input's accessible name) and
 *          passes every other React Native text input prop through to the input.
 * Boundary: no styling of its own beyond `self-start` when not full width and the muted text of a text affix; the look
 *           is HeroUI Native's, which pads the input by the measured width of each affix, on the inline-start and
 *           inline-end sides in both directions. A string or number affix is drawn as muted text, ignores touches so a
 *           press on it focuses the input, and stays visible to a screen reader (a unit is part of the value); any element
 *           is drawn as given and keeps its touches. `isDisabled` goes to the group too, since HeroUI Native's group
 *           otherwise resets the input's own. `className` styles the root; `name` does not reach the input.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (HeroUI Native on native); ADR 0055
 *          (forms: one field contract); owner decision 6 of STA-350 (thin wrappers).
 */
import {
  Description,
  FieldError,
  InputGroup as HeroInputGroup,
  Label,
  TextField as HeroTextField,
  Typography,
} from "heroui-native";
import type { ReactElement, ReactNode } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { TEXT_INPUT_TYPE_PROPS } from "#native/text-field/text-input-type-props.constant";
import type { InputGroupProps } from "#native/input-group/input-group.props";

/** True for what an affix draws as plain text beside the value. */
const isText = (content: ReactNode) => typeof content === "string" || typeof content === "number";

/** A text affix as muted text, which ignores touches; an element as given. */
function Affix({
  Part,
  content,
}: {
  readonly Part: typeof HeroInputGroup.Prefix | typeof HeroInputGroup.Suffix;
  readonly content: ReactNode;
}) {
  if (content == null) return null;
  if (!isText(content)) return <Part>{content}</Part>;
  return (
    <Part pointerEvents="none">
      <Typography.Paragraph type="body-sm" color="muted">
        {content}
      </Typography.Paragraph>
    </Part>
  );
}

/**
 * A labelled text field whose input carries a prefix and a suffix: a slug's `/`, a unit, a currency or a reveal button.
 * A field without a string `label` needs an `accessibilityLabel`. Pair `value` with `onChange` to control it, or give
 * `defaultValue` and let it keep its own text; `onChange` receives the new string.
 */
export function InputGroup({
  label,
  description,
  errorMessage,
  placeholder,
  prefix,
  suffix,
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
}: InputGroupProps): ReactElement {
  return (
    <HeroTextField
      {...omitUndefined({ isRequired, isInvalid, isDisabled })}
      className={[isFullWidth ? "" : "self-start", className].filter(Boolean).join(" ")}
    >
      {label == null ? null : <Label>{label}</Label>}
      <HeroInputGroup isDisabled={isDisabled ?? false}>
        <Affix Part={HeroInputGroup.Prefix} content={prefix} />
        <HeroInputGroup.Input
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
        <Affix Part={HeroInputGroup.Suffix} content={suffix} />
      </HeroInputGroup>
      {description == null ? null : <Description hideOnInvalid>{description}</Description>}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroTextField>
  );
}
