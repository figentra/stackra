/**
 * Stackra file contract:
 * Purpose: A number field bound by `name`.
 * Boundary: reached as a `Field` part; thin over the bound field (see field.tsx).
 *           Split from field.tsx so that file exports only the `Field` table and each part hot-reloads (rule-gap
 *           B-6, react/only-export-components).
 * Runtime: react-native
 * Governing contract: ADR 0055 (decision 2: thin field adapters); ADR 0305 (rules 10 to 13: one declaration per
 *                     file); ADR 0311 (fields props vocabulary).
 */
import type { ReactElement } from "react";
import { useSchemaField } from "#form/schema-form/use-schema-field";
import { NumberField } from "#native/number-field/number-field";
import type { NumberFieldProps } from "#native/number-field/number-field.props";
import type { BoundProps } from "#native/field/bound-props.type";

/** A number field bound by `name`. */
export function FieldNumber({ name, ...rest }: BoundProps<NumberFieldProps>): ReactElement {
  return <NumberField {...useSchemaField<number | null>(name)} {...rest} />;
}
