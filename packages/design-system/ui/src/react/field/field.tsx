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
import type { ReactElement } from "react";

import type { FormFieldBinding } from "#contracts/types/form-field-binding.type";
import { useSchemaField } from "#form/schema-form/use-schema-field";
import { ComboBox } from "#react/combo-box/combo-box";
import type { ComboBoxProps } from "#react/combo-box/combo-box.props";
import { NumberField } from "#react/number-field/number-field";
import type { NumberFieldProps } from "#react/number-field/number-field.props";
import { RadioGroup } from "#react/radio-group/radio-group";
import type { RadioGroupProps } from "#react/radio-group/radio-group.props";
import { Select } from "#react/select/select";
import type { SelectProps } from "#react/select/select.props";
import { Switch } from "#react/switch/switch";
import type { SwitchProps } from "#react/switch/switch.props";
import { TextField } from "#react/text-field/text-field";
import type { TextFieldProps } from "#react/text-field/text-field.props";

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

/** A choice of `Field.Select`. */
interface SelectOption {
  /** The value the field holds when this choice is picked. */
  readonly value: string;
  /** The text of the choice. */
  readonly label: string;
}

/** Props of `Field.Select`: the Select's own props with `options` in place of `items`. */
type FieldSelectProps = Omit<BoundProps<SelectProps>, "items"> & {
  /** The choices, in order. */
  readonly options: readonly SelectOption[];
};

/** Props of `Field.ComboBox`: the ComboBox's own props with any `items`, keyed and labelled by the caller. */
type FieldComboBoxProps<T> = Omit<BoundProps<ComboBoxProps>, "items" | "selectionMode"> & {
  /** The choices, such as the rows of a search. */
  readonly items: readonly T[];
  /** The member of an item the field's value holds. */
  readonly itemKey: { [K in keyof T]: T[K] extends string ? K : never }[keyof T];
  /** The text an item is shown and filtered by. */
  readonly itemLabel: (item: T) => string;
};

/** The structural descriptor `Field.Setting` draws: a setting key's path, label, kind and bounds or options. */
interface SettingDescriptor {
  /** The setting's path, which is the form field it binds to. */
  readonly path: string;
  /** The text the field is labelled with. */
  readonly label: string;
  /** How the setting is drawn: a switch, a number field, a select (needs `options`) or a text field. */
  readonly kind: "boolean" | "number" | "select" | "text";
  /** The lower bound of a number. */
  readonly min?: number;
  /** The upper bound of a number. */
  readonly max?: number;
  /** The choices of a select. */
  readonly options?: readonly SelectOption[];
}

/** Props of `Field.Setting`. */
interface FieldSettingProps {
  /** The setting to draw. */
  readonly setting: SettingDescriptor;
  /** Where the value comes from (such as `default`, `platform`, `tenant`), shown as the description. */
  readonly provenance?: string;
}

/** A single-line text field bound by `name`. */
function FieldText({ name, ...rest }: BoundProps<TextFieldProps>): ReactElement {
  return <TextField {...useSchemaField<string>(name)} {...rest} />;
}

/** A number field bound by `name`. */
function FieldNumber({ name, ...rest }: BoundProps<NumberFieldProps>): ReactElement {
  return <NumberField {...useSchemaField<number | null>(name)} {...rest} />;
}

/** A switch bound by `name`. */
function FieldSwitch({ name, ...rest }: BoundProps<SwitchProps>): ReactElement {
  return <Switch {...useSchemaField<boolean>(name)} {...rest} />;
}

/** A radio group bound by `name`. */
function FieldRadioGroup({ name, ...rest }: BoundProps<RadioGroupProps>): ReactElement {
  return <RadioGroup {...useSchemaField<string>(name)} {...rest} />;
}

/** A select bound by `name`, its `options` drawn as the Select's items. */
function FieldSelect({ name, options, ...rest }: FieldSelectProps): ReactElement {
  const items = options.map((option) => ({ id: option.value, label: option.label }));
  return <Select {...useSchemaField<string | null>(name)} {...rest} items={items} />;
}

/** A combo box bound by `name`, its items keyed by `itemKey` and labelled by `itemLabel`. */
function FieldComboBox<T>({
  name,
  items,
  itemKey,
  itemLabel,
  ...rest
}: FieldComboBoxProps<T>): ReactElement {
  const choices = items.map((item) => ({ id: String(item[itemKey]), label: itemLabel(item) }));
  return <ComboBox {...useSchemaField<string | null>(name)} {...rest} items={choices} />;
}

/** A setting bound by `setting.path`, drawn by its kind with its provenance as the description. */
function FieldSetting({ setting, provenance }: FieldSettingProps): ReactElement {
  const { path, label, kind, min, max, options } = setting;
  const common = { name: path, label, description: provenance };
  if (kind === "boolean") return <FieldSwitch {...common} />;
  if (kind === "number") return <FieldNumber {...common} minValue={min} maxValue={max} />;
  if (kind === "select") return <FieldSelect {...common} options={options ?? []} />;
  return <FieldText {...common} />;
}

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
