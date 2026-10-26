/**
 * Stackra file contract:
 * Purpose: the native `Field` parts: the design-system fields bound by `name` to the schema form of the surrounding
 *          `Form form={...}`, so a screen names each field once (`<Field.Number name="quantity" label=... />`):
 *          `Field.Text` and `Field.Number`, the same parts and props as on web.
 * Boundary: thin: each part reads the binding (`useSchemaField`) and draws the existing native field, so the look,
 *           the accessibility and the props vocabulary (`testID`, `className`, `autoCapitalize`) are that field's. The
 *           caller's props come after the binding, so an explicit `isRequired` wins. Must sit inside a `Form` given a
 *           `form`.
 * Runtime: react-native
 * Governing contract: ADR 0055 (decision 2: thin field adapters); ADR 0165 (decision 2); ADR 0302 (decision 3);
 *                     ADR 0311 (fields props vocabulary).
 */
import type { ReactElement } from "react";

import type { FormFieldBinding } from "#contracts/types/form-field-binding.type";
import { useSchemaField } from "#form/schema-form/use-schema-field";
import { NumberField } from "#native/number-field/number-field";
import type { NumberFieldProps } from "#native/number-field/number-field.props";
import { TextField } from "#native/text-field/text-field";
import type { TextFieldProps } from "#native/text-field/text-field.props";

/**
 * What a bound part takes: the field's own props minus what the form binds, plus the field's path. `isRequired` and
 * `isDisabled` stay, so the caller's explicit value wins over the binding's.
 */
type BoundProps<P> = Omit<
  P,
  Exclude<keyof FormFieldBinding<unknown>, "isRequired" | "isDisabled"> | "defaultValue"
> & {
  /** The field's path in the schema form, such as `lines.0.quantity`. */
  readonly name: string;
};

/** A single-line text field bound by `name`. */
function FieldText({ name, ...rest }: BoundProps<TextFieldProps>): ReactElement {
  return <TextField {...useSchemaField<string>(name)} {...rest} />;
}

/** A number field bound by `name`. */
function FieldNumber({ name, ...rest }: BoundProps<NumberFieldProps>): ReactElement {
  return <NumberField {...useSchemaField<number | null>(name)} {...rest} />;
}

/** The fields of a schema form, bound by name inside `Form form={...}`. */
export const Field = Object.freeze({
  Text: FieldText,
  Number: FieldNumber,
});
