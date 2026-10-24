/**
 * Stackra file contract:
 * Purpose: `UnsupportedVersionError` (`unsupported_version`), the refusal of a request whose `Stackra-Version` header,
 *          or whose API key's or OAuth app's pin, names a version the service does not serve.
 * Boundary: thrown by `resolveVersion` before the call runs; a validation refusal (400), never retryable. Its one detail
 *           is the dates the service serves, never the value the caller sent.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (decisions 3 and 4); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The version is not one the service serves; `supported` lists those it does. */
export class UnsupportedVersionError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The `YYYY-MM-DD` dates a caller may pin, oldest first. */
  supported!: string[];
}
