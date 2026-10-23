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
import {
  Description,
  FieldError,
  Input,
  Label,
  TextField as HeroTextField,
  type TextFieldRootProps,
} from "@heroui/react";

import type { TextFieldContractProps } from "#contracts/types/text-field-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the web TextField: the shared contract plus HeroUI v3's own text field props, passed through unchanged.
 * HeroUI's `fullWidth` is the contract's `isFullWidth`, and `children` is refused because the field draws its own parts.
 */
export type TextFieldProps = TextFieldContractProps &
  Omit<TextFieldRootProps, keyof TextFieldContractProps | "children" | "fullWidth">;

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
}: TextFieldProps) {
  return (
    <HeroTextField {...omitUndefined(rest)} variant={variant} fullWidth={isFullWidth}>
      {label == null ? null : <Label>{label}</Label>}
      <Input {...omitUndefined({ placeholder })} />
      {description == null ? null : <Description>{description}</Description>}
      {errorMessage == null ? null : <FieldError>{errorMessage}</FieldError>}
    </HeroTextField>
  );
}
