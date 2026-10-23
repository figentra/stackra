/**
 * Stackra file contract:
 * Purpose: the props every field of the design system shares, whatever it edits: its label, description and error
 *          message, the required, invalid, disabled and read-only states, and the controlled and uncontrolled value with
 *          its change handler and form name. TextField, TextArea, SearchField, the number input, Select, ComboBox and the
 *          Checkbox, RadioGroup and Switch family each extend it with their own props, so a form adapter binds any of
 *          them the same way. `TValue` is what the field edits: a string for text, a number for a number input, the
 *          chosen key for Select and RadioGroup, a list of keys for a group of checkboxes, and a boolean for a single
 *          Checkbox or Switch, where `value` is the selected state.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0055 (forms: one field contract for the react-hook-form adapter).
 */
import type { ReactNode } from "react";

/** Props shared by every field on web and native. */
export interface FieldContractProps<TValue> {
  /** The visible label; it is the field's accessible name, so a field without one needs the runtime's own name prop. */
  readonly label?: ReactNode;
  /** Help text under the field, tied to it for assistive technology. */
  readonly description?: ReactNode;
  /** What is wrong, shown under the field while `isInvalid` is true, and read out with the field. */
  readonly errorMessage?: ReactNode;
  /** True when the form cannot be submitted without a value; the label shows it and assistive technology is told. */
  readonly isRequired?: boolean | undefined;
  /** True to show the error state; the field alone never decides, so a form adapter sets it from its validation. */
  readonly isInvalid?: boolean | undefined;
  /** True to refuse input and show the disabled style; the field leaves the tab order and is left out of the submit. */
  readonly isDisabled?: boolean | undefined;
  /** True to show the value but refuse changes; unlike disabled, the field keeps focus and is submitted. */
  readonly isReadOnly?: boolean | undefined;
  /** The current value, for a controlled field; pair it with `onChange`. */
  readonly value?: TValue | undefined;
  /** The starting value, for an uncontrolled field. */
  readonly defaultValue?: TValue | undefined;
  /** Called with the new value each time the user changes it. */
  readonly onChange?: ((value: TValue) => void) | undefined;
  /** The name the value is submitted under in a form, and the key a form adapter binds. */
  readonly name?: string | undefined;
}
