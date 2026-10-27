/**
 * Stackra file contract:
 * Purpose: `CsrfTokenInvalidError`, the refusal `CsrfGuard` answers when a cookie-authenticated, state-changing
 *          request lacks the CSRF header, or (double-submit) the header does not repeat the token cookie.
 * Boundary: a refusal, so the generated adapter maps it to 403 and nobody reports it; code `csrf_token_invalid`. It
 *           says nothing about which check failed.
 * Runtime: node
 * Governing contract: ADR 0140 (error envelope and kinds); ADR 0437 (server-check order).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The CSRF header is missing or does not match.
 *
 * @example
 * throw CsrfTokenInvalidError.create();
 */
export class CsrfTokenInvalidError extends Refusal({ kind: ErrorKind.Forbidden }) {}
