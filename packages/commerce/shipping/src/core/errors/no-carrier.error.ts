/**
 * Stackra file contract:
 * Purpose: `NoCarrierError`, the refusal when no carrier can serve a call: the Market offers none with every capability
 *          the call needs, or a stored provider code is not a carrier connector.
 * Boundary: a refusal (`failed_precondition`, category `precondition_failed`); code `no_carrier`, derived from the
 *           class name. Raised by `CarrierGateways` drivers. The fields are codes only, never personal data.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 3); ADR 0356 (decisions 2 and 3); ADR 0140; ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable as it stands: the Market's carriers or the tenant's connections must change first.
 *
 * @example
 * throw NoCarrierError.create({ market: "zz", needs: "labels,pickups" });
 */
export class NoCarrierError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The Market asked for, when the call named one. */
  market?: string;

  /** The provider code asked for, when the call named one. */
  provider?: string;

  /** The capabilities the call needed, comma-separated. */
  needs?: string;
}
