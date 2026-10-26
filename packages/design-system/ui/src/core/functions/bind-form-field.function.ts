/**
 * Stackra file contract:
 * Purpose: turns what a form library keeps about one field (its name, value, handlers, disabled flag, validation
 *          state and rules) into the `FormFieldBinding` a design-system field takes, so web and native `FormField`
 *          share one mapping and a field never sees the library.
 * Boundary: pure. The inputs are structural slices of react-hook-form's `Controller` render arguments, so this file
 *           imports no library and runs anywhere; the caller keeps the value type.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055 (forms: the react-hook-form adapter).
 */
import type { FormFieldBinding } from "#contracts/types/form-field-binding.type";
import type { FormLibraryField } from "#core/types/form-library-field.type";
import type { FormLibraryFieldState } from "#core/types/form-library-field-state.type";

/**
 * The binding for one field. A field is required when its `required` rule is `true`, a message, or an object whose
 * `value` is true, which are the three forms react-hook-form accepts.
 * @param field - the form library's handle on the field
 * @param fieldState - the field's validation state
 * @param required - the field's `required` rule, if it has one
 * @returns the props to spread onto the design-system field
 */
export function bindFormField<TValue>(
  field: FormLibraryField<TValue>,
  fieldState: FormLibraryFieldState,
  required?: boolean | string | { readonly value?: boolean | undefined } | undefined,
): FormFieldBinding<TValue> {
  return {
    name: field.name,
    value: field.value,
    onChange: field.onChange,
    onBlur: field.onBlur,
    isInvalid: fieldState.invalid,
    // `rules: { required: true }` gives an empty message; an empty node would leave the red field with no text to read.
    errorMessage: fieldState.error?.message || undefined,
    isRequired: typeof required === "object" ? Boolean(required.value) : Boolean(required),
    isDisabled: field.disabled,
  };
}
