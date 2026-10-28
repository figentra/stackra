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
import { FieldText } from "#native/field/field-text";
import { FieldNumber } from "#native/field/field-number";

/** The fields of a schema form, bound by name inside `Form form={...}`. */
export const Field = Object.freeze({
  Text: FieldText,
  Number: FieldNumber,
});
