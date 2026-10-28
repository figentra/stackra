/**
 * Stackra file contract:
 * Purpose: `KeyUsage`, what `EncryptedFieldsResealService.usage` reports for one model: how many sealed values rest
 *          under each data key, and how many rows still hold a value off the current key, so an operator knows when
 *          no row needs an old key any more and it can be retired.
 * Boundary: a type only; counts, never a value or a key.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2); ADR 0465 (decision 5); gap gov7 (stackra-312).
 */

/** Key usage of one model's encrypted fields. */
export interface KeyUsage {
  /** The id of the key new values are sealed with. */
  readonly current: string;

  /** Rows read, every row of the table (soft-deleted and archived ones too). */
  readonly rows: number;

  /** Per key id, the sealed values resting under it (a null field counts nowhere). */
  readonly keys: Readonly<Record<string, number>>;

  /**
   * Rows with a value or a blind index off the current key, or a lookup field's index missing: what `reseal` still
   * has to do.
   */
  readonly stale: number;
}
