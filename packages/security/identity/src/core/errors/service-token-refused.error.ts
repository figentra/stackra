/**
 * Stackra file contract:
 * Purpose: `ServiceTokenRefusedError`, the issuer refused to give this service a token, or answered one that is not a
 *          token (`service_token_refused`): a wrong or revoked key, an unknown project, a misconfigured issuer.
 * Boundary: kind `Internal`, not retryable: a configuration fault of this service, never the caller's. It carries no
 *           details: never the key, the assertion, a token or the issuer's answer; the HTTP status rides in its cause's
 *           message.
 * Runtime: isomorphic
 * Governing contract: ADR 0140; ADR 0209 (decision 3).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The refusal when the issuer will not issue this service a token.
 *
 * @example
 * throw ServiceTokenRefusedError.create({}, { cause: new Error("token endpoint answered 400") });
 */
export class ServiceTokenRefusedError extends Refusal({ kind: ErrorKind.Internal }) {}
