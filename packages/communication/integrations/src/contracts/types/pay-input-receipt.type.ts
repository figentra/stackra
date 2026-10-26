/**
 * Stackra file contract:
 * Purpose: `PayInputReceipt`, what a payroll provider answers for a pushed batch: its own batch id and how many inputs
 *          it took.
 * Boundary: a type only. The receipt is the proof the batch reached the provider; the pay run itself is the
 *           provider's.
 * Runtime: isomorphic
 * Governing contract: RV-50; ADR 0422 (decision 5).
 */

/** A pushed batch. */
export interface PayInputReceipt {
  /** The provider's id of the batch. */
  readonly id: string;

  /** The number of inputs the provider took. */
  readonly accepted: number;
}
