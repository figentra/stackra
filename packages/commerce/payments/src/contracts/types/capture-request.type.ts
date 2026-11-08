/**
 * Stackra file contract:
 * Purpose: `CaptureRequest`, a capture of an authorised payment, in full or in part.
 * Boundary: a type in the leaf entry; `reference` identifies this capture and is its idempotency key.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2).
 */
import type { Money } from "@stackra/money";

import type { PaymentTarget } from "#contracts/types/payment-target.type";

/**
 * Take held money.
 *
 * @example
 * await gateway.capture({ payment: { reference, providerRef }, amount, reference: `capture:${reference}` });
 */
export interface CaptureRequest {
  /** The authorised payment. */
  readonly payment: PaymentTarget;

  /** How much to take. */
  readonly amount: Money;

  /** This capture's id. */
  readonly reference: string;

  /**
   * The platform's fee on a direct charge on the connected account (Stripe `application_fee_amount`), taken from
   * this capture; unlike `CheckoutRequest.platform`, which is a destination charge.
   */
  readonly applicationFee?: Money;
}
