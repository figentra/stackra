/**
 * Stackra file contract:
 * Purpose: `LicenceIssuerUnavailableError`, the refusal a `LicenceIssuer` throws when the licence server gives no
 *          usable answer: a network failure, a status outside 2xx, or a body without the id or file it should carry.
 * Boundary: kind `Unavailable`, code `licence_issuer_unavailable`, retryable, so the caller's listener or job retries.
 *           Its one detail is the HTTP status (0 when no response came); never the body or the product token.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0178 (decision 2); ADR 0294 (decisions 16 and 20).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The licence server did not answer usably; retry. */
export class LicenceIssuerUnavailableError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {
  /** The HTTP status, or 0 when the request never got one. */
  status!: number;
}
