/**
 * Stackra file contract:
 * Purpose: `SubjectRecord`, one row of a subject's personal data as a `PersonalDataStore` returns it: the row's id and
 *          the declared fields only.
 * Boundary: a type only; the store copies just the declared fields, so a column nobody declared never reaches an
 *           export. Values are what the model holds (a shredded field is still its sealed form).
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decision 1); STA-1375.
 */

/** One of the subject's rows. */
export interface SubjectRecord {
  /** The row's primary key. */
  readonly id: string;

  /** The declared fields of the row, by property name. */
  readonly fields: Readonly<Record<string, unknown>>;
}
