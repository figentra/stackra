/**
 * Stackra file contract:
 * Purpose: `PaymentFieldRequiredError`, the refusal when a provider needs a field the request left out (a billing country, the
 *          customer's phone for buy-now-pay-later).
 * Boundary: a refusal (`validation`, category `validation`); code `payment_field_required`, derived from the class name. The fields are
 *           codes and ids only, never personal or card data.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2); ADR 0140; ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable as it stands.
 *
 * @example
 * throw PaymentFieldRequiredError.create({ provider: "tamara", field: "customer.address" });
 */
export class PaymentFieldRequiredError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The provider code. */
  provider!: string;

  /** The request field, as a dotted path (`customer.address`). */
  field!: string;
}
