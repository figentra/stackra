/**
 * Stackra file contract:
 * Purpose: `VersionRequiredError` (`version_required`), the refusal of an API-key call that names no version: no
 *          `Stackra-Version` header and a key with no pin, so the service will not guess which shape the caller reads.
 * Boundary: thrown by `resolveVersion` when its `required` flag is set; a validation refusal (400), never retryable
 *           until the caller sends the header. Its details name the header and the current version, both public.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (decision 3); ADR 0140 (envelope and kinds); STA-2532 (FR-006, FR-016).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The call must name a version; `header` is the header to send and `current` the version to start from. */
export class VersionRequiredError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The header that names a version (`Stackra-Version`). */
  header!: string;

  /** The service's current (latest) `YYYY-MM-DD` version. */
  current!: string;
}
