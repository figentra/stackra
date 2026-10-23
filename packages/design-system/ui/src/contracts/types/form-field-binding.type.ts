/**
 * Stackra file contract:
 * Purpose: what `FormField` hands to the field it renders: the slice of the shared field contract that a form
 *          library owns (the name, the value and its change handler, the invalid state and its message, whether a value
 *          is required, whether the field is disabled) plus the blur handler a form library needs to know a field was
 *          touched. Spread onto TextField, TextArea, Select, ComboBox, Checkbox, RadioGroup or Switch, it binds that
 *          field to the form without the field knowing which library is behind it.
 * Boundary: types only. The slice is a subset of `FieldContractProps`, so any field of the design system accepts it;
 *           the label, description and presentation props stay the caller's.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); ADR 0055 (forms: the
 *          react-hook-form adapter over the field contract).
 */
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** The props a form library binds on a field, for a field that edits a `TValue`. */
export interface FormFieldBinding<TValue> extends Pick<
  FieldContractProps<TValue>,
  "value" | "onChange" | "isInvalid" | "isRequired" | "isDisabled" | "errorMessage"
> {
  /** The path the form holds the value under; a form library always has one, so it is required here. */
  readonly name: string;
  /** Called when the field loses focus, so the form can mark it touched and validate on blur. */
  readonly onBlur: () => void;
}
