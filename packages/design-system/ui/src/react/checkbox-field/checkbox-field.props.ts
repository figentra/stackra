/**
 * Stackra file contract:
 * Purpose: `CheckboxFieldProps`, the props of the web `CheckboxField` in `checkbox-field.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0055 (decision 2); ADR 0165 (decision
 *          2: form adapters in @stackra/ui); ADR 0302 (decision 3).
 */
import type { ReactNode } from "react";
import type { CheckboxProps } from "#react/checkbox/checkbox.props";

/** Props of the web CheckboxField: the Checkbox's own, with the label as `children`. */
export type CheckboxFieldProps = Omit<CheckboxProps, "label"> & {
  /** The label, the checkbox's accessible name. */
  readonly children?: ReactNode;
};
