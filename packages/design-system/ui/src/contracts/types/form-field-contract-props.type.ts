/**
 * Stackra file contract:
 * Purpose: the props every runtime's `FormField` takes: the form it belongs to (`control`), the field's `name` in that
 *          form, optional validation `rules`, and a `render` function that receives the binding and draws the field.
 *          Each runtime's `FormFieldProps` is this contract, which is the same on web and native.
 * Boundary: types only. The names and rules are react-hook-form's own (ADR 0055), picked from its `Controller`, so a
 *           form already written for react-hook-form moves over unchanged; the resolver (Zod) is not part of this
 *           contract and stays in `@stackra/validation`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055 (forms: one field contract for the
 *          react-hook-form adapter).
 */
import type { ReactElement } from "react";
import type { ControllerProps, FieldPath, FieldPathValue, FieldValues } from "react-hook-form";

import type { FormFieldBinding } from "#contracts/types/form-field-binding.type";

/**
 * Props shared by the web and native `FormField`, for a form of `TFieldValues` and the field at path `TName`. `control`
 * may be left out inside react-hook-form's `FormProvider`.
 */
export interface FormFieldContractProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Pick<
  ControllerProps<TFieldValues, TName>,
  "control" | "name" | "rules" | "defaultValue" | "disabled" | "shouldUnregister"
> {
  /** Draws the field from the binding: spread it first, then add the label and the presentation props. */
  readonly render: (binding: FormFieldBinding<FieldPathValue<TFieldValues, TName>>) => ReactElement;
}
