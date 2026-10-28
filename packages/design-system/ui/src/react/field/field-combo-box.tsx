/**
 * Stackra file contract:
 * Purpose: A combo box bound by `name`, its items keyed by `itemKey` and labelled by `itemLabel`.
 * Boundary: reached as a `Field` part; thin over the bound field (see field.tsx).
 *           Split from field.tsx so that file exports only the `Field` table and each part hot-reloads (rule-gap
 *           B-6, react/only-export-components).
 * Runtime: browser
 * Governing contract: ADR 0055 (decision 2: thin field adapters); ADR 0305 (rules 10 to 13: one declaration per
 *                     file); ADR 0311 (fields props vocabulary).
 */
import type { ReactElement } from "react";
import { useSchemaField } from "#form/schema-form/use-schema-field";
import { ComboBox } from "#react/combo-box/combo-box";
import type { FieldComboBoxProps } from "#react/field/field-combo-box.props";

/** A combo box bound by `name`, its items keyed by `itemKey` and labelled by `itemLabel`. */
export function FieldComboBox<T>({
  name,
  items,
  itemKey,
  itemLabel,
  ...rest
}: FieldComboBoxProps<T>): ReactElement {
  const choices = items.map((item) => ({ id: String(item[itemKey]), label: itemLabel(item) }));
  return <ComboBox {...useSchemaField<string | null>(name)} {...rest} items={choices} />;
}
