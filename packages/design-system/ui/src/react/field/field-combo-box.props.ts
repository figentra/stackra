/**
 * Stackra file contract:
 * Purpose: Props of `Field.ComboBox`: the ComboBox's own props with any `items`, keyed and labelled by the caller.
 * Boundary: types only. Split from field.tsx so that file exports only the `Field` table and each part hot-reloads
 *           (rule-gap B-6, react/only-export-components).
 * Runtime: browser
 * Governing contract: ADR 0055 (decision 2: thin field adapters); ADR 0305 (rules 10 to 13: one declaration per
 *                     file); ADR 0311 (fields props vocabulary).
 */
import type { ComboBoxProps } from "#react/combo-box/combo-box.props";
import type { BoundProps } from "#react/field/bound-props.type";

/** Props of `Field.ComboBox`: the ComboBox's own props with any `items`, keyed and labelled by the caller. */
export type FieldComboBoxProps<T> = Omit<BoundProps<ComboBoxProps>, "items" | "selectionMode"> & {
  /** The choices, such as the rows of a search. */
  readonly items: readonly T[];
  /** The member of an item the field's value holds. */
  readonly itemKey: { [K in keyof T]: T[K] extends string ? K : never }[keyof T];
  /** The text an item is shown and filtered by. */
  readonly itemLabel: (item: T) => string;
};
