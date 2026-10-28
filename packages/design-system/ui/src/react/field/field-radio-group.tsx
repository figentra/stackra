/**
 * Stackra file contract:
 * Purpose: A radio group bound by `name`.
 * Boundary: reached as a `Field` part; thin over the bound field (see field.tsx).
 *           Split from field.tsx so that file exports only the `Field` table and each part hot-reloads (rule-gap
 *           B-6, react/only-export-components).
 * Runtime: browser
 * Governing contract: ADR 0055 (decision 2: thin field adapters); ADR 0305 (rules 10 to 13: one declaration per
 *                     file); ADR 0311 (fields props vocabulary).
 */
import type { ReactElement } from "react";
import { useSchemaField } from "#form/schema-form/use-schema-field";
import { RadioGroup } from "#react/radio-group/radio-group";
import type { RadioGroupProps } from "#react/radio-group/radio-group.props";
import type { BoundProps } from "#react/field/bound-props.type";

/** A radio group bound by `name`. */
export function FieldRadioGroup({ name, ...rest }: BoundProps<RadioGroupProps>): ReactElement {
  return <RadioGroup {...useSchemaField<string>(name)} {...rest} />;
}
