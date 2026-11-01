/**
 * Stackra file contract:
 * Purpose: the web `TextField` on HeroUI v3's TextField: one component that draws the label, the input, the
 *          description and the error message of a single-line text field, maps the shared field contract (`isFullWidth`
 *          to `fullWidth`, one default each for `primary` and full width) and passes every other React Aria text field
 *          prop (`type`, `autoComplete`, `maxLength`, `validate`, `className`, `aria-label`) through to HeroUI's root.
 *          With the AI module installed and Tamo on, a plain `text` field gets Tamo's actions (`TamoFieldAssist`), and
 *          a field Tamo filled in a form shows the review marker.
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. The label, description and error
 *           are tied to the input by React Aria, so the name, the hint and the error are read with the field. HeroUI
 *           hides the description while the field is invalid, so the error replaces it. With Tamo the field keeps its
 *           own text when uncontrolled, so an accepted draft can land in it.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0055
 *          (forms: one field contract); owner decision 6 of STA-350 (thin wrappers); ADR 0507 (the `ai` slot).
 */
import { useContext, useState, type ReactElement } from "react";
import { Description, FieldError, Input, Label, TextField as HeroTextField } from "@heroui/react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { TamoReviewContext } from "#react/hooks/tamo-review-context";
import { useTamo } from "#react/hooks/use-tamo";
import { TamoMarker } from "#react/tamo-marker/tamo-marker";
import { contentWidthClassName } from "#react/text-field/content-width-class-name.function";
import { TamoFieldAssist } from "#react/text-field/tamo-field-assist";
import type { TamoSlot } from "#contracts/types/tamo-slot.type";
import type { TextFieldProps } from "#react/text-field/text-field.props";

/**
 * A labelled single-line text field. A field without a visible `label` needs an `aria-label`. Pair `value` with
 * `onChange` to control it, or give `defaultValue` and let it keep its own text; `onChange` receives the new string.
 */
export function TextField({ ai, ...props }: TextFieldProps): ReactElement {
  const tamo = useTamo({ field: props.name }, ai !== false && (props.type ?? "text") === "text");
  const needsReview = useContext(TamoReviewContext).has(props.name ?? "");
  return tamo ? (
    <TamoTextField tamo={tamo} needsReview={needsReview} {...props} />
  ) : (
    <PlainTextField needsReview={needsReview} {...props} />
  );
}

/** The field without Tamo. */
function PlainTextField({
  label,
  description,
  errorMessage,
  placeholder,
  variant = "primary",
  isFullWidth = true,
  needsReview,
  ...rest
}: TextFieldProps & { readonly needsReview: boolean }): ReactElement {
  return (
    <HeroTextField
      {...omitUndefined(rest)}
      {...(isFullWidth ? {} : { className: contentWidthClassName(rest.className) })}
      variant={variant}
      fullWidth={isFullWidth}
    >
      {label == null ? null : <Label>{label}</Label>}
      <Input {...omitUndefined({ placeholder })} />
      {needsReview ? <TamoMarker needsReview /> : null}
      {description == null ? null : <Description>{description}</Description>}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroTextField>
  );
}

/** The field with Tamo's actions; it holds its own text when uncontrolled. */
function TamoTextField({
  tamo,
  label,
  description,
  errorMessage,
  placeholder,
  variant = "primary",
  isFullWidth = true,
  needsReview,
  value,
  defaultValue,
  onChange,
  ...rest
}: TextFieldProps & { readonly tamo: TamoSlot; readonly needsReview: boolean }): ReactElement {
  const [own, setOwn] = useState(defaultValue ?? "");
  const text = value ?? own;
  const change = (next: string) => {
    setOwn(next);
    onChange?.(next);
  };
  return (
    <HeroTextField
      {...omitUndefined(rest)}
      {...(isFullWidth ? {} : { className: contentWidthClassName(rest.className) })}
      value={text}
      onChange={change}
      variant={variant}
      fullWidth={isFullWidth}
    >
      {label == null ? null : <Label>{label}</Label>}
      <TamoFieldAssist
        slot={tamo}
        field={rest.name}
        value={text}
        onChange={change}
        isMultiline={false}
      >
        <Input className="pe-10" {...omitUndefined({ placeholder })} />
      </TamoFieldAssist>
      {needsReview ? <TamoMarker needsReview /> : null}
      {description == null ? null : <Description>{description}</Description>}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroTextField>
  );
}
