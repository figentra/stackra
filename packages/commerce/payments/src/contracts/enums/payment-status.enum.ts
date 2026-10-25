/**
 * Stackra file contract:
 * Purpose: `PaymentStatus`, where one payment stands at its provider, including `unknown`: the result of a call was
 *          lost and only a lookup at the provider may say what happened.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. Every driver maps its provider's
 *           own states onto these codes; codes are snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 6: the `unknown` state); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The payment states the engine reasons about.
 *
 * @example
 * if (record.status === PaymentStatus.Unknown) await payments.reconcile(record.reference);
 */
export const PaymentStatus = Enum.of({
  /** Waiting for the customer: a hosted page, a terminal or a redirect is open. */
  Pending: "pending",
  /** Approved and held; a capture or a void follows. */
  Authorized: "authorized",
  /** Money taken. */
  Captured: "captured",
  /** Captured, then refunded in part. */
  PartiallyRefunded: "partially_refunded",
  /** Captured, then refunded in full. */
  Refunded: "refunded",
  /** Released before capture, or a session closed unpaid. */
  Voided: "voided",
  /** Declined, expired or abandoned; nothing was taken. */
  Failed: "failed",
  /** The answer was lost; a lookup at the provider must come before any retry. */
  Unknown: "unknown",
});

/** One of the codes above. */
export type PaymentStatus = Enum.Value<typeof PaymentStatus>;
