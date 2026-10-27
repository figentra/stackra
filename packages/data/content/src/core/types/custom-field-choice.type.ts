/**
 * Stackra file contract:
 * Purpose: `CustomFieldChoice`, one option of a `select` or `multi_select` custom field: the value stored on a record and
 *          its label per locale.
 * Boundary: a type only; data, never code (ADR 0154). The value is 1 to 100 characters and distinct within its field;
 *           each label is 1 to 120 characters and carries no template expression.
 * Runtime: isomorphic
 * Governing contract: ADR 0116 (decision CT2); ADR 0226 (decision 1); ADR 0162 (per-locale text).
 */

/**
 * One option of a `select` or `multi_select` custom field.
 *
 * @example
 * const large: CustomFieldChoice = { value: "l", label: { en: "Large", ar: "كبير" } };
 */
export interface CustomFieldChoice {
  /** What a record stores when this choice is picked. */
  readonly value: string;

  /** The text shown for it, per locale tag. */
  readonly label: Readonly<Record<string, string>>;
}
