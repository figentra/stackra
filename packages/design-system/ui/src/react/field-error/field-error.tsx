/**
 * Stackra file contract:
 * Purpose: the web `FieldError` on HeroUI v3's FieldError (React Aria): the message under a field, shown while the
 *          field is invalid; with `isInvalid` it follows a caller's own validation state, as a form adapter keeps it,
 *          and without it the field it sits in decides. Every other HeroUI prop passes through.
 * Boundary: React Aria shows the error only from a validation context, which a HeroUI field provides; `isInvalid`
 *          provides one around the error, keeping what a field around it already knows (its messages), so the one
 *          prop works inside a field and beside a plain control. Beside a plain control the caller ties the message to
 *          the control with `id` and the control's `aria-describedby`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI v3 on web); ADR 0055 (forms); ADR 0303.
 */
import { FieldError as HeroFieldError } from "@heroui/react";
import { useContext, type ContextType, type ReactElement } from "react";
import { FieldErrorContext } from "react-aria-components";
import type { FieldErrorProps } from "#react/field-error/field-error.props";

/** What React Aria's validation context holds. */
type Validation = NonNullable<ContextType<typeof FieldErrorContext>>;

/** The validity of a value the caller has marked invalid: a custom error, with no browser rule to name. */
const CALLER_INVALID: Validation["validationDetails"] = Object.freeze({
  badInput: false,
  customError: true,
  patternMismatch: false,
  rangeOverflow: false,
  rangeUnderflow: false,
  stepMismatch: false,
  tooLong: false,
  tooShort: false,
  typeMismatch: false,
  valid: false,
  valueMissing: false,
});

/**
 * The message under a field. Give it the text as children. Leave `isInvalid` out inside a HeroUI field, which shows
 * the error while it is invalid; set it beside a plain control or from a form adapter.
 */
export function FieldError({ isInvalid, ...rest }: FieldErrorProps): ReactElement {
  const inherited = useContext(FieldErrorContext);
  const error = <HeroFieldError {...rest} />;
  if (isInvalid === undefined) return error;
  const validation: Validation = {
    validationErrors: [],
    validationDetails: CALLER_INVALID,
    ...inherited,
    isInvalid,
  };
  return <FieldErrorContext value={validation}>{error}</FieldErrorContext>;
}
