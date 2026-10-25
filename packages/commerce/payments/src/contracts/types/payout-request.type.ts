/**
 * Stackra file contract:
 * Purpose: `PayoutRequest`, money sent from the platform's provider balance to a merchant's account.
 * Boundary: a type in the leaf entry; `reference` is the idempotency key.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2: the platform-payments layer).
 */
import type { Money } from "@stackra/money";

/**
 * Pay a merchant out.
 *
 * @example
 * await gateway.payout({ reference: "po_1", amount, destination: account.accountRef });
 */
export interface PayoutRequest {
  /** This payout's id. */
  readonly reference: string;

  /** How much. */
  readonly amount: Money;

  /** The merchant's account at the provider. */
  readonly destination: string;

  /** What the merchant sees. */
  readonly description?: string;
}
