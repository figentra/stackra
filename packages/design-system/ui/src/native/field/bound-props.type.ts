/**
 * Stackra file contract:
 * Purpose: What a bound part takes: the field's own props minus what the form binds, plus the field's path. `isRequired` and
 * Boundary: types only. Split from field.tsx so that file exports only the `Field` table and each part hot-reloads
 *           (rule-gap B-6, react/only-export-components).
 * Runtime: react-native
 * Governing contract: ADR 0055 (decision 2: thin field adapters); ADR 0305 (rules 10 to 13: one declaration per
 *                     file); ADR 0311 (fields props vocabulary).
 */
import type { FormFieldBinding } from "#contracts/types/form-field-binding.type";

/**
 * What a bound part takes: the field's own props minus what the form binds, plus the field's path. `isRequired` and
 * `isDisabled` stay, so the caller's explicit value wins over the binding's.
 */
export type BoundProps<P> = Omit<
  P,
  Exclude<keyof FormFieldBinding<unknown>, "isRequired" | "isDisabled"> | "defaultValue"
> & {
  /** The field's path in the schema form, such as `lines.0.quantity`. */
  readonly name: string;
};
