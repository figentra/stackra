/**
 * Stackra file contract:
 * Purpose: `UnmappedAccountError` (`unmapped_account`), the refusal of a journal that names an account key or a tax key
 *          the Connection's `AccountMap` does not map.
 * Boundary: kind `FailedPrecondition`, never retryable: the tenant completes the mapping, then the job runs again.
 *           Raised before any provider call. Its details are the journal's reference and the one unmapped key, never
 *           an amount.
 * Runtime: isomorphic
 * Governing contract: ADR 0140; ADR 0328; STA-794 (account mapping per Connection).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A key of the journal has no mapping.
 *
 * @example
 * throw UnmappedAccountError.create({ reference: "inv_1", account: "sales" });
 */
export class UnmappedAccountError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The journal's reference. */
  reference!: string;

  /** The account key with no provider code, when an account is the cause. */
  account?: string;

  /** The tax key with no provider code, when a tax code is the cause. */
  taxCode?: string;
}
