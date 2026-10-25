/**
 * Stackra file contract:
 * Purpose: `useSchemaField(name)`, the field descriptor the renderers' `Field.*` parts read: the binding of the field
 *          at `name` in the schema form the nearest `Form form={...}` provides, through react-hook-form's controller.
 * Boundary: platform-neutral React (react-hook-form only). It must sit inside a `Form` given a `form`; react-hook-form
 *           throws outside one. Changing the value clears a server error on that field, as `field(name)` does.
 * Runtime: isomorphic
 * Governing contract: ADR 0055 (decision 2: thin field adapters); ADR 0165 (decision 2); ADR 0302 (decision 3).
 */
import { useController, useFormContext } from "react-hook-form";

import type { FormFieldBinding } from "#contracts/types/form-field-binding.type";
import { bindFormField } from "#core/functions/bind-form-field.function";

/**
 * The binding of the field at `name` in the surrounding schema form.
 *
 * @example
 * const binding = useSchemaField<number>("quantity");
 * return <NumberField {...binding} label="Quantity" />;
 */
export function useSchemaField<TValue>(name: string): FormFieldBinding<TValue> {
  const { clearErrors } = useFormContext();
  const { field, fieldState } = useController({ name });
  return bindFormField<TValue>(
    {
      ...field,
      onChange: (value) => {
        clearErrors(name);
        field.onChange(value);
      },
    },
    fieldState,
  );
}
