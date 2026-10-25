/**
 * Stackra file contract:
 * Purpose: `CapabilityUnsupportedError`, the refusal when the provider serving a payment cannot do what was asked (a capture on a
 *          provider that only takes payment at once).
 * Boundary: a refusal (`failed_precondition`, category `precondition_failed`); code `capability_unsupported`, derived from the class name. The fields are
 *           codes and ids only, never personal or card data.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2); ADR 0140; ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable as it stands.
 *
 * @example
 * throw CapabilityUnsupportedError.create({ provider: "fawry", capability: "capture" });
 */
export class CapabilityUnsupportedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The provider code. */
  provider!: string;

  /** The `PaymentCapability` it lacks. */
  capability!: string;
}
