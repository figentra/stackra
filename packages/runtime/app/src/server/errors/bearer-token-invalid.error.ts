/**
 * Stackra file contract:
 * Purpose: `BearerTokenInvalidError`, the refusal the bearer-token guard answers when a request to a non-public
 *          endpoint carries no `Authorization: Bearer` token, or one whose signature, algorithm, issuer, audience or
 *          time is wrong.
 * Boundary: a refusal, so the generated adapter maps it to 401 and nobody reports it; code `bearer_token_invalid`.
 *           It says nothing about which check failed, so a prober learns nothing.
 * Runtime: node
 * Governing contract: ADR 0140 (error envelope and kinds); ADR 0206 (decision 8).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The bearer token is missing or invalid.
 *
 * @example
 * throw BearerTokenInvalidError.create();
 */
export class BearerTokenInvalidError extends Refusal({ kind: ErrorKind.Unauthenticated }) {}
