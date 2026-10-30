/**
 * Stackra file contract:
 * Purpose: the web `TextField` on HeroUI v3's TextField: one component that draws the label, the input, the
 *          description and the error message of a single-line text field, maps the shared field contract (`isFullWidth`
 *          to `fullWidth`, one default each for `primary` and full width) and passes every other React Aria text field
 *          prop (`type`, `autoComplete`, `maxLength`, `validate`, `className`, `aria-label`) through to HeroUI's root.
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. The label, description and error
 *           are tied to the input by React Aria, so the name, the hint and the error are read with the field. HeroUI
 *           hides the description while the field is invalid, so the error replaces it.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0055
 *          (forms: one field contract); owner decision 6 of STA-350 (thin wrappers).
 */
import type { ReactElement } from "react";
import { Description, FieldError, Input, Label, TextField as HeroTextField } from "@heroui/react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { contentWidthClassName } from "#react/text-field/content-width-class-name.function";
import type { TextFieldProps } from "#react/text-field/text-field.props";

/**
 * A labelled single-line text field. A field without a visible `label` needs an `aria-label`. Pair `value` with
 * `onChange` to control it, or give `defaultValue` and let it keep its own text; `onChange` receives the new string.
 */
export function TextField({
  label,
  description,
  errorMessage,
  placeholder,
  variant = "primary",
  isFullWidth = true,
  ...rest
}: TextFieldProps): ReactElement {
  return (
    <HeroTextField
      {...omitUndefined(rest)}
      {...(isFullWidth ? {} : { className: contentWidthClassName(rest.className) })}
      variant={variant}
      fullWidth={isFullWidth}
    >
      {label == null ? null : <Label>{label}</Label>}
      <Input {...omitUndefined({ placeholder })} />
      {description == null ? null : <Description>{description}</Description>}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroTextField>
  );
}
