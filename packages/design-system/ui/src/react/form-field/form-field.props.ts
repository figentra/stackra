/**
 * Stackra file contract:
 * Purpose: `FormFieldProps`, the props of the web `FormField` in `form-field.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0055 (forms: react-hook-form over the field contract); ADR 0165 (UI contract); WCAG 2.2 SC 3.3.1.
 */
import type { FieldPath, FieldValues } from "react-hook-form";
import type { FormFieldContractProps } from "#contracts/types/form-field-contract-props.type";

/** Props of the web FormField: the shared contract, which is react-hook-form's `Controller` options plus `render`. */
export type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldContractProps<TFieldValues, TName>;
