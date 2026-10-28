/**
 * Stackra file contract:
 * Purpose: Props of `Field.Select`: the Select's own props with `options` in place of `items`.
 * Boundary: types only. Split from field.tsx so that file exports only the `Field` table and each part hot-reloads
 *           (rule-gap B-6, react/only-export-components).
 * Runtime: browser
 * Governing contract: ADR 0055 (decision 2: thin field adapters); ADR 0305 (rules 10 to 13: one declaration per
 *                     file); ADR 0311 (fields props vocabulary).
 */
import type { SelectProps } from "#react/select/select.props";
import type { BoundProps } from "#react/field/bound-props.type";
import type { SelectOption } from "#react/field/select-option.type";

/** Props of `Field.Select`: the Select's own props with `options` in place of `items`. */
export type FieldSelectProps = Omit<BoundProps<SelectProps>, "items"> & {
  /** The choices, in order. */
  readonly options: readonly SelectOption[];
};
