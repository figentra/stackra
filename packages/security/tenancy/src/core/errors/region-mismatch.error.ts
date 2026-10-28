/**
 * Stackra file contract:
 * Purpose: `RegionMismatchError`, the refusal of a call whose tenant is placed in another region than the deployment
 *          that received it (`region_mismatch`): a misrouted request or job, refused instead of served out of region.
 * Boundary: raised by `RegionGuardDriver` before anything else runs; kind `FailedPrecondition` (HTTP 412), not
 *           retryable here: the login directory must route it to the tenant's region. Its details name that region
 *           key, the caller's own tenant's; nothing else travels with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0353 (decisions 1 and 2: a region fixed at sign-up, a directory that routes); ADR 0172
 *                     (decision 3); ADR 0140 (envelope and kinds); stackra-310.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable in this region.
 *
 * @example
 * throw RegionMismatchError.create({ region: "eu" });
 */
export class RegionMismatchError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The region key the tenant is placed in. */
  region!: string;
}
