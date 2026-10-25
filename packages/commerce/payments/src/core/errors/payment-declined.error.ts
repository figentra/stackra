/**
 * Stackra file contract:
 * Purpose: `PaymentDeclinedError`, the refusal when the provider turns the customer down before any page opens (a
 *          buy-now-pay-later pre-score).
 * Boundary: a refusal (`failed_precondition`, category `precondition_failed`); code `payment_declined`, derived from the class name. The fields are
 *           codes and ids only, never personal or card data.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2); ADR 0140; ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable as it stands.
 *
 * @example
 * throw PaymentDeclinedError.create({ provider: "tabby", providerCode: "not_available" });
 */
export class PaymentDeclinedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The provider code. */
  provider!: string;

  /** The provider's reason code, when it gave one. */
  providerCode?: string;
}
