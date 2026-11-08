/**
 * Stackra file contract:
 * Purpose: the web `ColorField` on HeroUI v3's ColorField: ColorPicker's field contract drawn as HeroUI's label, input
 *          group (a swatch of the current colour before the hex input), description and error, editing one `#rrggbb`
 *          string; every other HeroUI ColorField prop passes through (`validate`, `channel` and `colorSpace` among
 *          them).
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. React Aria parses and commits
 *           the typed text on blur or Enter and steps it with the arrow keys; `onChange` is called with the colour in
 *           lowercase hex, or an empty string when the field is cleared. A value React Aria cannot parse shows as empty.
 *           A field without a `label` is named by `aria-label`, else by the package's own word for a colour. The hex
 *           input stays left to right in a right-to-left page.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0055 (one field contract);
 *          owner decision 6 of STA-350 (thin wrappers); WCAG 2.2 SC 1.3.1, 3.3.1 and 4.1.2; STA-1981.
 */
import { ColorField as HeroColorField, Description, FieldError, Label } from "@heroui/react";
import { useState, type ReactElement } from "react";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { ColorFieldProps } from "#react/color-field/color-field.props";
import { ColorSwatch } from "#react/color-swatch/color-swatch";
import { isParsableColor } from "#react/color-swatch/is-parsable-color.function";
import { useUiText } from "#react/hooks/use-ui-text";

/** The colour React Aria can read, or null for an empty or unreadable one. */
const colorOf = (text: string | undefined) =>
  text !== undefined && text !== "" && isParsableColor(text) ? text : null;

/** A field that takes a colour as a typed hex code. */
export function ColorField({
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
  name,
  placeholder,
  isFullWidth,
  ...rest
}: ColorFieldProps): ReactElement {
  const t = useUiText();
  const [own, setOwn] = useState(defaultValue ?? "");
  const shown = colorOf(value ?? own);
  return (
    <HeroColorField
      {...(label || rest["aria-label"] || rest["aria-labelledby"]
        ? {}
        : { "aria-label": t(FORMS_KEYS.ui.color_picker.label) })}
      {...rest}
      {...omitUndefined({ isRequired, isInvalid, isDisabled, isReadOnly, name })}
      {...(value === undefined
        ? { defaultValue: colorOf(defaultValue) }
        : { value: colorOf(value) })}
      onChange={(color) => {
        const next = color === null ? "" : color.toString("hex").toLowerCase();
        if (value === undefined) setOwn(next);
        onChange?.(next);
      }}
      fullWidth={isFullWidth ?? false}
    >
      {label ? <Label>{label}</Label> : null}
      <HeroColorField.Group>
        {shown === null ? null : (
          <HeroColorField.Prefix aria-hidden="true">
            <ColorSwatch color={shown} size="sm" />
          </HeroColorField.Prefix>
        )}
        <HeroColorField.Input dir="ltr" {...omitUndefined({ placeholder })} />
      </HeroColorField.Group>
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroColorField>
  );
}
