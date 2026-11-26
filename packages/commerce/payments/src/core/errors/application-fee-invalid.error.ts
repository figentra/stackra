/**
 * Stackra file contract:
 * Purpose: `ApplicationFeeInvalidError`, the refusal of a direct-charge `applicationFee` that cannot be taken: in another
 *          currency than the payment, negative, above the amount it is taken from, or beside a destination `platform`
 *          share on one checkout.
 * Boundary: a refusal (`validation`); code `application_fee_invalid`, derived from the class name. It names the payment
 *           reference and the reason code only, never an amount.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2); ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable as it stands.
 *
 * @example
 * throw ApplicationFeeInvalidError.create({ reference: "inv_7", reason: "above_amount" });
 */
export class ApplicationFeeInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The payment's reference. */
  reference!: string;

  /** Why: `currency`, `negative`, `above_amount` or `with_platform`. */
  reason!: string;
}
