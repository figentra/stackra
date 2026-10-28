/**
 * Stackra file contract:
 * Purpose: A choice of `Field.Select`.
 * Boundary: types only. Split from field.tsx so that file exports only the `Field` table and each part hot-reloads
 *           (rule-gap B-6, react/only-export-components).
 * Runtime: browser
 * Governing contract: ADR 0055 (decision 2: thin field adapters); ADR 0305 (rules 10 to 13: one declaration per
 *                     file); ADR 0311 (fields props vocabulary).
 */

/** A choice of `Field.Select`. */
export interface SelectOption {
  /** The value the field holds when this choice is picked. */
  readonly value: string;
  /** The text of the choice. */
  readonly label: string;
}
