/**
 * Stackra file contract:
 * Purpose: `VersionSunsetError` (`version_sunset`), the refusal of a request shaped for a version whose sunset has
 *          passed: a newer version shipped more than its support window ago.
 * Boundary: thrown by `resolveVersion` before the call runs; a failed precondition (412), never retryable (the same
 *           version keeps failing). Its details are the version and its sunset day, both public.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (decision 4 and its enforcement: a response on a sunset version is refused); ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The version is past its sunset; move to a newer one. */
export class VersionSunsetError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The refused `YYYY-MM-DD` version. */
  version!: string;

  /** The `YYYY-MM-DD` day it stopped being served. */
  sunset!: string;
}
