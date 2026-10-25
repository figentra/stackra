/**
 * Stackra file contract:
 * Purpose: `NoPaymentProviderError`, the refusal when no payments provider can serve a call: the Market offers none with every
 *          capability the call needs, or a stored provider code is not one of this package's drivers.
 * Boundary: a refusal (`failed_precondition`, category `precondition_failed`); code `no_payment_provider`, derived from the class name. The fields are
 *           codes and ids only, never personal or card data.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 2 and 3); ADR 0140; ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable as it stands.
 *
 * @example
 * throw NoPaymentProviderError.create({ market: "zz", needs: "checkout,capture" });
 */
export class NoPaymentProviderError extends Refusal({
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
