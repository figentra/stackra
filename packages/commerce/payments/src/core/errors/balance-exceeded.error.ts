/**
 * Stackra file contract:
 * Purpose: `BalanceExceededError` (`balance_exceeded`), the refusal of a partial payment that would take more than is
 *          left of its balance once the open and paid parts are counted (another payer got there first), or of any part
 *          once the balance is settled.
 * Boundary: kind `FailedPrecondition`, not retryable as is: the payer re-reads what is left. Carries the balance and
 *           part references only.
 * Runtime: isomorphic
 * Governing contract: ADR 0140; STA-1024.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The part would take more than is left of the balance. */
export class BalanceExceededError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The balance's reference. */
  balance!: string;

  /** The refused part's payment reference. */
  part!: string;
}
