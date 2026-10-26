/**
 * Stackra file contract:
 * Purpose: `PayoutHeldError` (`payout_held`), the refusal of a payout from a `connected-account` connection whose
 *          payouts are held (its owner is not verified yet).
 * Boundary: kind `FailedPrecondition`, retryable once the hold lifts. Carries the payout reference only.
 * Runtime: isomorphic
 * Governing contract: R4-6; M3-2; ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The connected account's payouts are held. */
export class PayoutHeldError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: true,
}) {
  /** The payout's reference. */
  reference!: string;
}
