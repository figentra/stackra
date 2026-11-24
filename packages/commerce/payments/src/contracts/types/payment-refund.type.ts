/**
 * Stackra file contract:
 * Purpose: `PaymentRefund`, one refund the provider accepted, kept on the payment's record under the caller's idempotency
 *          reference, so a retry of the same refund is answered with the first answer and counted once.
 * Boundary: a type in the leaf entry; stored inside the `PaymentRecord`. The amount is `Money`. A refund the provider failed
 *           is not kept, so its reference may be tried again.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 5: refunds are counted when confirmed); ADR 0388; ADR 0220 (decision 5).
 */
import type { Money } from "@stackra/money";

import type { TransferStatus } from "#contracts/enums/transfer-status.enum";

/**
 * A refund of a payment as the provider accepted it.
 *
 * @example
 * const [first] = record.refunds ?? [];
 */
export interface PaymentRefund {
  /** The caller's idempotency key of the refund, unique within the payment. */
  readonly reference: string;

  /** What the refund returned. */
  readonly amount: Money;

  /** The provider's id of the refund. */
  readonly providerRef: string;

  /** The state the provider answered with. */
  readonly status: TransferStatus;
}
