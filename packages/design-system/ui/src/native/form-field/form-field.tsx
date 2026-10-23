/**
 * Stackra file contract:
 * Purpose: the native `FormField`, on the same contract as the web one: binds one design-system field to a
 *          react-hook-form form (ADR 0055). It wraps react-hook-form's `Controller` and calls `render` with the field's
 *          binding (name, value, change and blur handlers, invalid state and message, required and disabled), which the
 *          caller spreads onto a native TextField, TextArea, Select, ComboBox, Checkbox, RadioGroup or Switch.
 * Boundary: no view and no styling of its own: the field it renders draws everything. There is no native form
 *           element to disable the browser's validation on, so nothing like the web's `validationBehavior` is needed.
 *           The resolver (Zod) is not added here; it stays in `@stackra/validation`. The field's native node is not
 *           handed to react-hook-form, so a failed submit does not move focus to the first invalid field yet.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); ADR 0055 (forms:
 *          react-hook-form over the field contract); ADR 0165 (UI contract).
 */
import type { ReactElement } from "react";
import { Controller, type FieldPath, type FieldPathValue, type FieldValues } from "react-hook-form";

import type { FormFieldContractProps } from "#contracts/types/form-field-contract-props.type";
import { bindFormField } from "#core/functions/bind-form-field.function";

/** Props of the native FormField: the shared contract, which is react-hook-form's `Controller` options plus `render`. */
export type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldContractProps<TFieldValues, TName>;

/**
 * A form field bound to react-hook-form. Give it the form's `control` (or sit it inside `FormProvider`), the field's
 * `name` and a `render` that spreads the binding first: `render={(binding) => <TextField {...binding} label="Email" />}`.
 * Give the form `defaultValues`, so the field is controlled from its first render.
 */
export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ render, ...options }: FormFieldProps<TFieldValues, TName>): ReactElement {
  const required = options.rules?.required;
  return (
    <Controller
      {...options}
      render={({ field, fieldState }) =>
        render(bindFormField<FieldPathValue<TFieldValues, TName>>(field, fieldState, required))
      }
    />
  );
}
