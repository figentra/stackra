/**
 * Stackra file contract:
 * Purpose: the web `Field` parts: the design-system fields bound by `name` to the schema form of the surrounding
 *          `Form form={...}`, so a form names each field once (`<Field.Number name="quantity" label=... />`).
 *          `Field.Text`, `Field.Number`, `Field.Switch`, `Field.RadioGroup` (its `options`), `Field.Select` (its
 *          `options` as `{ value, label }`) and `Field.ComboBox` (any `items`, keyed by `itemKey`, labelled by
 *          `itemLabel`), and `Field.Setting` (a setting descriptor drawn by its kind, its provenance as the
 *          description).
 * Boundary: thin: each part reads the binding (`useSchemaField`) and draws the existing field, so the look, the
 *           accessibility and the props vocabulary are that field's. The caller's props come after the binding, so an
 *           explicit `isRequired` or `isDisabled` wins. Must sit inside a `Form` given a `form`.
 * Runtime: browser
 * Governing contract: ADR 0055 (decision 2: thin field adapters); ADR 0165 (decision 2); ADR 0302 (decision 3);
 *                     ADR 0311 (fields props vocabulary).
 */
import { FieldText } from "#react/field/field-text";
import { FieldNumber } from "#react/field/field-number";
import { FieldSwitch } from "#react/field/field-switch";
import { FieldRadioGroup } from "#react/field/field-radio-group";
import { FieldSelect } from "#react/field/field-select";
import { FieldComboBox } from "#react/field/field-combo-box";
import { FieldSetting } from "#react/field/field-setting";

/** The fields of a schema form, bound by name inside `Form form={...}`. */
export const Field = Object.freeze({
  Text: FieldText,
  Number: FieldNumber,
  Switch: FieldSwitch,
  RadioGroup: FieldRadioGroup,
  Select: FieldSelect,
  ComboBox: FieldComboBox,
  Setting: FieldSetting,
});
