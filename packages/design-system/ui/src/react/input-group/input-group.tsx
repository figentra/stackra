/**
 * Stackra file contract:
 * Purpose: the web `InputGroup` on HeroUI v3's TextField and InputGroup: one component that draws the label, an input
 *          with a prefix and a suffix inside one border, the description and the error message, maps the shared field
 *          contract (`isFullWidth` to `fullWidth` on the field and the group, one default each for `primary` and full
 *          width) and passes every other React Aria text field prop (`type`, `autoComplete`, `maxLength`,
 *          `className`, `aria-label`) through to HeroUI's root.
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. The group takes its invalid and
 *           disabled look from the field, and a press on a text affix or the border focuses the input (HeroUI's rule). An
 *           element affix, a button for one, keeps its own clicks, since HeroUI's rule would otherwise move keyboard
 *           focus from the button to the input at each press.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0055
 *          (forms: one field contract); owner decision 6 of STA-350 (thin wrappers).
 */
import {
  Description,
  FieldError,
  InputGroup as HeroInputGroup,
  Label,
  TextField as HeroTextField,
  type TextFieldRootProps,
} from "@heroui/react";
import type { MouseEvent, ReactNode } from "react";

import type { InputGroupContractProps } from "#contracts/types/input-group-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** The click handler an element affix takes so HeroUI's focus-the-input rule skips it; text affixes need none. */
function ownClicks(content: ReactNode) {
  return typeof content === "string" || typeof content === "number"
    ? {}
    : { onClick: (event: MouseEvent) => event.stopPropagation() };
}

/**
 * Props of the web InputGroup: the shared contract plus HeroUI v3's own text field props, passed through unchanged.
 * HeroUI's `fullWidth` is the contract's `isFullWidth`, and `children` is refused because the field draws its own parts.
 */
export type InputGroupProps = InputGroupContractProps &
  Omit<TextFieldRootProps, keyof InputGroupContractProps | "children" | "fullWidth">;

/**
 * A labelled text field whose input carries a prefix and a suffix: a slug's `/`, a unit, a currency or a reveal button.
 * A field without a visible `label` needs an `aria-label`. Text affixes are read with the field; the prefix sits on the
 * inline-start side and the suffix on the inline-end side, in both directions.
 */
export function InputGroup({
  label,
  description,
  errorMessage,
  placeholder,
  prefix,
  suffix,
  variant = "primary",
  isFullWidth = true,
  ...rest
}: InputGroupProps) {
  return (
    <HeroTextField {...omitUndefined(rest)} variant={variant} fullWidth={isFullWidth}>
      {label == null ? null : <Label>{label}</Label>}
      {/* The text field's full-width rule reaches only inputs, so the group is told too. */}
      {/* `aria-disabled`: a disabled field's text affixes are exempt from contrast, but only a checker that reads it here
          can tell, because the affixes are not the native control. */}
      <HeroInputGroup
        fullWidth={isFullWidth}
        {...(rest.isDisabled ? { "aria-disabled": true } : {})}
      >
        {prefix == null ? null : (
          <HeroInputGroup.Prefix {...ownClicks(prefix)}>{prefix}</HeroInputGroup.Prefix>
        )}
        <HeroInputGroup.Input {...omitUndefined({ placeholder })} />
        {suffix == null ? null : (
          <HeroInputGroup.Suffix {...ownClicks(suffix)}>{suffix}</HeroInputGroup.Suffix>
        )}
      </HeroInputGroup>
      {description == null ? null : <Description>{description}</Description>}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroTextField>
  );
}
