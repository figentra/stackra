/**
 * Stackra file contract:
 * Purpose: `PackNotFoundError`, the refusal when no loaded pack version of a market (or of a market it overlays) fits
 *          the pin and the accepted statuses.
 * Boundary: a refusal (`not_found`); code `pack_not_found`, derived from the class name. The fields are codes only.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decisions 3 and 4); ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * No version to serve.
 *
 * @example
 * throw PackNotFoundError.create({ market: "eu-de", pin: "2" });
 */
export class PackNotFoundError extends Refusal({ kind: ErrorKind.NotFound, retryable: false }) {
  /** The market with no fitting version. */
  market!: string;

  /** The pin it was resolved under, when there was one. */
  pin?: string;
}
