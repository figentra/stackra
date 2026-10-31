/**
 * Stackra file contract:
 * Purpose: the web `TextArea` on HeroUI v3's TextField and TextArea: one component that draws the label, the
 *          multi-line input, the description and the error message, maps the shared field contract (`isFullWidth` to
 *          `fullWidth`, one default each for `primary` and full width, `rows` to the area's lines) and passes every
 *          other React Aria text field prop (`maxLength`, `autoComplete`, `validate`, `className`, `aria-label`)
 *          through to HeroUI's root. With the AI module installed and Tamo on, it gets Tamo's actions, "Continue
 *          writing" as ghost text and a first draft (`TamoFieldAssist`); a field Tamo filled shows the review marker.
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. The label, description and error
 *           are tied to the area by React Aria. The area does not grow with its text: it scrolls after `rows` lines,
 *           and the browser's own resize handle is HeroUI's choice.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0055
 *          (forms: one field contract); owner decision 6 of STA-350 (thin wrappers); ADR 0507 (the `ai` slot).
 */
import { useContext, useState, type ReactElement } from "react";
import {
  Description,
  FieldError,
  Label,
  TextArea as HeroTextArea,
  TextField as HeroTextField,
} from "@heroui/react";

import type { TamoSlot } from "#contracts/types/tamo-slot.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { TamoReviewContext } from "#react/hooks/tamo-review-context";
import { useTamo } from "#react/hooks/use-tamo";
import { TamoMarker } from "#react/tamo-marker/tamo-marker";
import { contentWidthClassName } from "#react/text-field/content-width-class-name.function";
import { TamoFieldAssist } from "#react/text-field/tamo-field-assist";
import type { TextAreaProps } from "#react/text-area/text-area.props";

/**
 * A labelled multi-line text field. A field without a visible `label` needs an `aria-label`. Pair `value` with
 * `onChange` to control it, or give `defaultValue` and let it keep its own text; `onChange` receives the new string.
 */
export function TextArea({ ai, ...props }: TextAreaProps): ReactElement {
  const tamo = useTamo({ field: props.name }, ai !== false);
  const needsReview = useContext(TamoReviewContext).has(props.name ?? "");
  return tamo ? (
    <TamoTextArea tamo={tamo} needsReview={needsReview} {...props} />
  ) : (
    <PlainTextArea needsReview={needsReview} {...props} />
  );
}

/** The area without Tamo. */
function PlainTextArea({
  label,
  description,
  errorMessage,
  placeholder,
  rows,
  variant = "primary",
  isFullWidth = true,
  needsReview,
  ...rest
}: TextAreaProps & { readonly needsReview: boolean }): ReactElement {
  return (
    <HeroTextField
      {...omitUndefined(rest)}
      {...(isFullWidth ? {} : { className: contentWidthClassName(rest.className) })}
      variant={variant}
      fullWidth={isFullWidth}
    >
      {label == null ? null : <Label>{label}</Label>}
      <HeroTextArea {...omitUndefined({ placeholder, rows })} />
      {needsReview ? <TamoMarker needsReview /> : null}
      {description == null ? null : <Description>{description}</Description>}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroTextField>
  );
}

/** The area with Tamo's actions; it holds its own text when uncontrolled. */
function TamoTextArea({
  tamo,
  label,
  description,
  errorMessage,
  placeholder,
  rows,
  variant = "primary",
  isFullWidth = true,
  needsReview,
  value,
  defaultValue,
  onChange,
  ...rest
}: TextAreaProps & { readonly tamo: TamoSlot; readonly needsReview: boolean }): ReactElement {
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
      <TamoFieldAssist slot={tamo} field={rest.name} value={text} onChange={change} isMultiline>
        <HeroTextArea className="pe-10" {...omitUndefined({ placeholder, rows })} />
      </TamoFieldAssist>
      {needsReview ? <TamoMarker needsReview /> : null}
      {description == null ? null : <Description>{description}</Description>}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroTextField>
  );
}
