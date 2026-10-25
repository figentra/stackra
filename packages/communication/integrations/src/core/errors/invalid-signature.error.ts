/**
 * Stackra file contract:
 * Purpose: `InvalidSignatureError` (`invalid_signature`), the refusal of an inbound provider webhook whose signature
 *          does not verify against the secret its URL resolves (the connection's on a connection's URL, the
 *          Integration's on the platform's).
 * Boundary: kind `Unauthenticated`, never retryable, no details: nothing of the body, the signature or the secret
 *           travels with it. Thrown by `@stackra/webhooks` before any field is parsed; declared here because the
 *           Integration owns verification (ADR 0308 rule 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 15 and 16); ADR 0224 (webhooks); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The webhook's signature does not verify; nothing runs. */
export class InvalidSignatureError extends Refusal({
  kind: ErrorKind.Unauthenticated,
  retryable: false,
}) {}
