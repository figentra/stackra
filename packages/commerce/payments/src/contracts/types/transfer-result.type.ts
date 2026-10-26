/**
 * Stackra file contract:
 * Purpose: `TransferResult`, a refund or payout as the provider accepted it.
 * Boundary: a type in the leaf entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2).
 */
import type { TransferStatus } from "#contracts/enums/transfer-status.enum";

/**
 * The provider's id and state of a money movement.
 *
 * @example
 * const { status } = await gateway.refund(request);
 */
export interface TransferResult {
  /** The provider's id of the refund or payout. */
  readonly providerRef: string;

  /** The state of the transfer. */
  readonly status: TransferStatus;
}
