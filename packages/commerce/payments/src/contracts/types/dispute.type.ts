/**
 * Stackra file contract:
 * Purpose: `Dispute`, one chargeback as the provider reports it.
 * Boundary: a type in the leaf entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (Enforcement: the dispute port).
 */
import type { Money } from "@stackra/money";

import type { DisputeStatus } from "#contracts/enums/dispute-status.enum";

/**
 * A chargeback.
 *
 * @example
 * const dispute = await gateway.dispute("dp_1");
 */
export interface Dispute {
  /** The provider's id of the dispute. */
  readonly providerRef: string;

  /** The provider's id of the disputed payment. */
  readonly paymentRef: string;

  /** The disputed amount. */
  readonly amount: Money;

  /** The provider's reason code. */
  readonly reason: string;

  /** Its state. */
  readonly status: DisputeStatus;

  /** When evidence is due, while it is. */
  readonly respondBy?: Date;
}
