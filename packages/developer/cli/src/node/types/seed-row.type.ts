/**
 * Stackra file contract:
 * Purpose: `SeedRow`, one row of a seed record: its id inside the record, the owner answer it comes from, and its
 *          values.
 * Boundary: a type only. `answer` is required, so a changed owner answer changes one row, never code.
 * Runtime: node
 * Governing contract: config-model section 6 (a spec cites the answer id beside each seed value).
 */

/** One seed row. */
export type SeedRow = {
  /** The row's id, unique in its record (`refund-window-days`). */
  readonly id: string;

  /** The owner answer or default it encodes (`COM-160`, `XP-6`, `OS-17`). */
  readonly answer: string;

  /** The row's values, as the record kind's reader expects them. */
  readonly [field: string]: unknown;
};
