/**
 * Stackra file contract:
 * Purpose: `LicenceCheckUnavailableError`, the refusal `checkLicenceKey` throws when Keygen gives no verdict: a status
 *          other than 200, or a body without `meta.valid`.
 * Boundary: kind `Unavailable`, code `licence_check_unavailable`, retryable. Its one detail is the HTTP status; never
 *           the licence key or the body. A failed online check never changes the offline standing (ADR 0178 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0178 (decision 5); ADR 0294 (decisions 16 and 20).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** Keygen did not answer the check; the install keeps its offline standing. */
export class LicenceCheckUnavailableError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {
  /** The HTTP status Keygen answered with. */
  status!: number;
}
