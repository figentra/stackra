/**
 * Stackra file contract:
 * Purpose: `OriginNotAllowedError`, the refusal `OriginGuard` answers when a state-changing request comes from an
 *          origin that is neither the API's own nor in `CorsConfig.allowedOrigins`, or carries a cookie and no origin.
 * Boundary: a refusal, so the generated adapter maps it to 403 and nobody reports it; code `origin_not_allowed`. It
 *           does not echo the origin.
 * Runtime: node
 * Governing contract: ADR 0140 (error envelope and kinds); ADR 0437 (server-check order).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The request's origin is not allowed.
 *
 * @example
 * throw OriginNotAllowedError.create();
 */
export class OriginNotAllowedError extends Refusal({ kind: ErrorKind.Forbidden }) {}
