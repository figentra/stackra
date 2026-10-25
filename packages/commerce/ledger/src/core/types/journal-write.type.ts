/**
 * Stackra file contract:
 * Purpose: `JournalWrite`, what an append or a posting did: written, or not written because the reference was already
 *          applied or because the write would have taken a balance below its floor.
 * Boundary: a type only. Neither refusal throws: a duplicate is the normal answer to a retried call, and a caller turns
 *           `belowFloor` into its own refusal (the loyalty kit's `InsufficientPointsError`).
 * Runtime: node
 * Governing contract: ADR 0220 (decision 5: idempotency in the entry).
 */

/**
 * The outcome of one write.
 *
 * @example
 * const { written, belowFloor } = await journal.append(entry, { floor: 0 });
 * if (belowFloor) throw InsufficientPointsError.create({ requested: -entry.amount });
 */
export interface JournalWrite {
  /** True when the entry (or every line of the posting) was written now. */
  readonly written: boolean;

  /** True when nothing was written because a balance would have gone below its floor. */
  readonly belowFloor: boolean;
}
