/**
 * Stackra file contract:
 * Purpose: `ResolutionReasonRequiredError`, the refusal of a manual resolution of an `unknown` payment that gives no reason.
 * Boundary: a refusal (`validation`, category `validation`); code `resolution_reason_required`, derived from the class name. The fields are
 *           codes and ids only, never personal or card data.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 6: by hand, with a reason); ADR 0140; ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable as it stands.
 *
 * @example
 * throw ResolutionReasonRequiredError.create({ reference: "ord_1" });
 */
export class ResolutionReasonRequiredError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The merchant's id of the payment. */
  reference!: string;
}
