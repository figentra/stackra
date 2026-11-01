/**
 * Stackra file contract:
 * Purpose: `ConnectedAccountLimitsMissingError` (`connected_account_limits_missing`), the refusal of a payment or
 *          payout on a `connected-account` connection when no limits are set for it: the `none` driver runs (the
 *          product enabled connected accounts without a limits driver) or the stored-limits driver holds no row.
 * Boundary: kind `FailedPrecondition`, not retryable: the platform sets limits or binds a driver first. Carries the
 *           connection id only.
 * Runtime: isomorphic
 * Governing contract: R4-6; M3-2; ADR 0140; STA-1707.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The connected account has no limits to check against. */
export class ConnectedAccountLimitsMissingError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The connection without limits. */
  connectionId!: string;
}
