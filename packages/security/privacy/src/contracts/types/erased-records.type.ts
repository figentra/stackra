/**
 * Stackra file contract:
 * Purpose: `ErasedRecords`, one line of an erasure receipt: how many rows of one declared model were deleted or
 *          anonymised.
 * Boundary: a type only; counts, never ids or contents, so a receipt carries no personal data. Rows kept by a hold
 *           are in the receipt's `kept` list instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decision 2); STA-1375.
 */
import type { ErasureMethod } from "#contracts/enums/erasure-method.enum";

/** Rows of one model an erasure disposed of. */
export interface ErasedRecords {
  /** The declaration's kind name (the model's name). */
  readonly kind: string;

  /** `delete` when the rows were deleted, `anonymise` when edited, `shred` when only the key covers them. */
  readonly method: ErasureMethod;

  /** How many rows. */
  readonly count: number;
}
