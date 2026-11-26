/**
 * Stackra file contract:
 * Purpose: `ServiceTokenUnavailableError`, the issuer's token endpoint could not be reached, timed out, throttled the
 *          request or failed on its side (`service_token_unavailable`).
 * Boundary: kind `Unavailable`, retryable true: an outage, not a bad key. It carries no details: never the key, the
 *           assertion, a token or the issuer's answer; the HTTP status or the failure's name rides in its cause's
 *           message.
 * Runtime: isomorphic
 * Governing contract: ADR 0140; ADR 0209 (decision 3).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The refusal when the issuer's token endpoint is unreachable, slow, throttling or failing.
 *
 * @example
 * throw ServiceTokenUnavailableError.create({}, { cause: new Error("token endpoint answered 503") });
 */
export class ServiceTokenUnavailableError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {}
