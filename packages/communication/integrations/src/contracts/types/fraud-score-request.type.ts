/**
 * Stackra file contract:
 * Purpose: `FraudScoreRequest`, what a fraud scorer is asked about: an order or a payment, its amount, the buyer's
 *          contact and network signals, and the addresses.
 * Boundary: a type only. Personal data travels for this one score; the connector passes it through without storing
 *           it, and fields the caller does not have are left out.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 5); ADR 0134 (personal data).
 */
import type { Email } from "@stackra/contracts";
import type { Money } from "@stackra/money";
import type { Address } from "@stackra/validation";

/** An order or payment to score. */
export interface FraudScoreRequest {
  /** Our reference of the order or payment, kept by the scorer for later feedback. */
  readonly reference: string;

  /** The amount at stake. */
  readonly amount: Money;

  /** The buyer's email. */
  readonly email?: Email;

  /** The buyer's phone in E.164. */
  readonly phone?: `+${string}`;

  /** The buyer's IP address. */
  readonly ip?: string;

  /** The scorer's device or session id, set by its script on the storefront. */
  readonly deviceId?: string;

  /** The billing address. */
  readonly billTo?: Address;

  /** The shipping address. */
  readonly shipTo?: Address;

  /** How it is paid (a payment method code of ours). */
  readonly paymentMethod?: string;
}
