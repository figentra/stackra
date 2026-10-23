/**
 * Stackra file contract:
 * Purpose: the web `TextArea` on HeroUI v3's TextField and TextArea: one component that draws the label, the
 *          multi-line input, the description and the error message, maps the shared field contract (`isFullWidth` to
 *          `fullWidth`, one default each for `primary` and full width, `rows` to the area's lines) and passes every
 *          other React Aria text field prop (`maxLength`, `autoComplete`, `validate`, `className`, `aria-label`)
 *          through to HeroUI's root.
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. The label, description and error
 *           are tied to the area by React Aria. The area does not grow with its text: it scrolls after `rows` lines,
 *           and the browser's own resize handle is HeroUI's choice.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0055
 *          (forms: one field contract); owner decision 6 of STA-350 (thin wrappers).
 */
import {
  Description,
  FieldError,
  Label,
  TextArea as HeroTextArea,
  TextField as HeroTextField,
  type TextFieldRootProps,
} from "@heroui/react";

import type { TextAreaContractProps } from "#contracts/types/text-area-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the web TextArea: the shared contract plus HeroUI v3's own text field props, passed through unchanged.
 * HeroUI's `fullWidth` is the contract's `isFullWidth`; `children` is refused because the field draws its own parts,
 * and `type` because an area has no kind of text.
 */
export type TextAreaProps = TextAreaContractProps &
  Omit<TextFieldRootProps, keyof TextAreaContractProps | "children" | "fullWidth" | "type">;

/**
 * A labelled multi-line text field. A field without a visible `label` needs an `aria-label`. Pair `value` with
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
  ...rest
}: TextAreaProps) {
  return (
    <HeroTextField {...omitUndefined(rest)} variant={variant} fullWidth={isFullWidth}>
      {label == null ? null : <Label>{label}</Label>}
      <HeroTextArea {...omitUndefined({ placeholder, rows })} />
      {description == null ? null : <Description>{description}</Description>}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroTextField>
  );
}
