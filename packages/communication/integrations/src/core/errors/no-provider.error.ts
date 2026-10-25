/**
 * Stackra file contract:
 * Purpose: `NoProviderError` (`no_provider`), the refusal when no provider can serve a capability: the tenant has no
 *          Connection of it, the Market offers none that fits, or a stored provider code has no driver here.
 * Boundary: kind `FailedPrecondition`, never retryable as it stands. Its details are codes only (capability, Market,
 *           provider), never a Connection's fields.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 2 and 3); ADR 0140; ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Nothing serves the capability.
 *
 * @example
 * throw NoProviderError.create({ capability: "sms", market: "sa" });
 */
export class NoProviderError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The capability asked for (`sms`). */
  capability?: string;

  /** The Market asked for, when the call had one. */
  market?: string;

  /** The provider code asked for, when the call named one. */
  provider?: string;
}
