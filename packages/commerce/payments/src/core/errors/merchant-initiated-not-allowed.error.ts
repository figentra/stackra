/**
 * Stackra file contract:
 * Purpose: `MerchantInitiatedNotAllowedError`, the refusal of a merchant-initiated charge on a token whose customer never agreed to
 *          one.
 * Boundary: a refusal (`failed_precondition`, category `precondition_failed`); code `merchant_initiated_not_allowed`, derived from the class name. The fields are
 *           codes and ids only, never personal or card data.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 5); ADR 0140; ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable as it stands.
 *
 * @example
 * throw MerchantInitiatedNotAllowedError.create({ reference: "inv_7" });
 */
export class MerchantInitiatedNotAllowedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The merchant's id of the refused charge. */
  reference!: string;
}
