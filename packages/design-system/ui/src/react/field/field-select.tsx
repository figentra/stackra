/**
 * Stackra file contract:
 * Purpose: A select bound by `name`, its `options` drawn as the Select's items.
 * Boundary: reached as a `Field` part; thin over the bound field (see field.tsx).
 *           Split from field.tsx so that file exports only the `Field` table and each part hot-reloads (rule-gap
 *           B-6, react/only-export-components).
 * Runtime: browser
 * Governing contract: ADR 0055 (decision 2: thin field adapters); ADR 0305 (rules 10 to 13: one declaration per
 *                     file); ADR 0311 (fields props vocabulary).
 */
import type { ReactElement } from "react";
import { useSchemaField } from "#form/schema-form/use-schema-field";
import { Select } from "#react/select/select";
import type { FieldSelectProps } from "#react/field/field-select.props";

/** A select bound by `name`, its `options` drawn as the Select's items. */
export function FieldSelect({ name, options, ...rest }: FieldSelectProps): ReactElement {
  const items = options.map((option) => ({ id: option.value, label: option.label }));
  return <Select {...useSchemaField<string | null>(name)} {...rest} items={items} />;
}
