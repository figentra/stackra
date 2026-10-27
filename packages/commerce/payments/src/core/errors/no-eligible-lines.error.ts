/**
 * Stackra file contract:
 * Purpose: `NoEligibleLinesError` (`no_eligible_lines`), the refusal of a restricted tender payment when nothing in the
 *          basket is eligible (or the tender's balance is zero), so there is nothing for it to pay.
 * Boundary: kind `FailedPrecondition`, not retryable as it stands. Carries the payment reference and program code only.
 * Runtime: isomorphic
 * Governing contract: ADR 0445; ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Nothing for the restricted tender to pay.
 *
 * @example
 * throw NoEligibleLinesError.create({ reference: "ord_1", program: "snap" });
 */
export class NoEligibleLinesError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The payment's reference. */
  reference!: string;

  /** The program code. */
  program!: string;
}
